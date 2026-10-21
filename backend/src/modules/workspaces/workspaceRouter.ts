import { Router, Response } from 'express';
import { prisma, handleDatabaseError } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const workspaceRouter = Router();

function getWorkspaceLimit(storageQuotaBytes: bigint): number {
  const quotaGB = Number(storageQuotaBytes) / (1024 * 1024 * 1024);
  if (quotaGB <= 2.1) return 3;
  if (quotaGB <= 110) return 10;
  return 100;
}

const ALL_PERMISSION_KEYS = [
  'canDownload',
  'canUpload',
  'canEdit',
  'canMove',
  'canDelete',
  'canShare',
  'canManagePermissions',
] as const;

export function normalizePermissions(inputJson?: any): Record<string, boolean> {
  const jsonObj = inputJson && typeof inputJson === 'object' ? inputJson : {};
  const result: Record<string, boolean> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    result[key] = Boolean(jsonObj[key]);
  }
  return result;
}

function resolveRolePermissions(role: string, customAttrs?: Record<string, any>): Record<string, boolean> {
  const normalizedRole = (role || 'MEMBER').toUpperCase();

  let defaults: Record<string, boolean>;

  if (normalizedRole === 'OWNER' || normalizedRole === 'ADMIN') {
    defaults = {
      canDownload: true,
      canUpload: true,
      canEdit: true,
      canMove: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: true,
    };
  } else if (normalizedRole === 'VIEWER') {
    defaults = {
      canDownload: true,
      canUpload: false,
      canEdit: false,
      canMove: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    };
  } else if (normalizedRole === 'EDITOR' || normalizedRole === 'MEMBER') {
    defaults = {
      canDownload: true,
      canUpload: true,
      canEdit: true,
      canMove: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: false,
    };
  } else {

    defaults = {
      canDownload: false,
      canUpload: false,
      canEdit: false,
      canMove: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    };
  }

  if (customAttrs && typeof customAttrs === 'object') {
    const finalPerms: Record<string, boolean> = {};
    for (const key of ALL_PERMISSION_KEYS) {
      if (customAttrs[key] !== undefined) {
        finalPerms[key] = Boolean(customAttrs[key]);
      } else {
        finalPerms[key] = Boolean(defaults[key]);
      }
    }
    return finalPerms;
  }

  return defaults;
}

workspaceRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const maxWorkspaces = getWorkspaceLimit(user.storageQuota);

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { OR: [{ userId }, { email: userEmail }] } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          select: {
            id: true,
            userId: true,
            email: true,
            role: true,
            permissions: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { files: true, folders: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ownedCount = workspaces.filter(w => w.ownerId === userId).length;

    const serializedWorkspaces = workspaces.map(w => {
      const isOwner = w.ownerId === userId;
      const member = w.members.find(m => m.userId === userId || m.email === userEmail);
      const role = isOwner ? 'OWNER' : member?.role || 'MEMBER';

      const permissions = isOwner
        ? resolveRolePermissions('OWNER')
        : member
          ? normalizePermissions(member.permissions)
          : normalizePermissions({});

      return {
        ...w,
        storageQuota: w.storageQuota.toString(),
        storageUsed: w.storageUsed.toString(),
        isOwner,
        role,
        permissions,
        memberCount: w._count.members,
        fileCount: w._count.files,
        folderCount: w._count.folders,
      };
    });

    return res.json({
      workspaces: serializedWorkspaces,
      limitInfo: {
        ownedCount,
        maxWorkspaces,
        storageQuota: user.storageQuota.toString(),
        planName: maxWorkspaces === 3 ? 'Free Plan' : maxWorkspaces === 10 ? 'Starter Plan' : 'Pro Plan',
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const maxWorkspaces = getWorkspaceLimit(user.storageQuota);
    const ownedCount = await prisma.workspace.count({ where: { ownerId: userId } });

    if (ownedCount >= maxWorkspaces) {
      const planName = maxWorkspaces === 3 ? 'Free Plan' : maxWorkspaces === 10 ? 'Starter Plan' : 'Pro Plan';
      return res.status(403).json({
        error: `Workspace creation limit reached. Your current ${planName} permits up to ${maxWorkspaces} workspaces. Upgrade your plan to create more.`,
        limitReached: true,
        maxWorkspaces,
        ownedCount,
      });
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          ownerId: userId,
          storageQuota: user.storageQuota,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: userId,
          email: userEmail,
          role: 'OWNER',
          permissions: resolveRolePermissions('OWNER'),
          status: 'ACTIVE',
        },
      });

      return ws;
    });

    return res.status(201).json({
      workspace: {
        ...workspace,
        storageQuota: workspace.storageQuota.toString(),
        storageUsed: workspace.storageUsed.toString(),
        isOwner: true,
        role: 'OWNER',
        permissions: resolveRolePermissions('OWNER'),
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { files: true, folders: true, members: true } },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = workspace.ownerId === userId;
    const member = workspace.members.find(m => m.userId === userId || m.email === userEmail);

    if (!isOwner && !member) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const permissions = isOwner
      ? resolveRolePermissions('OWNER')
      : member
        ? normalizePermissions(member.permissions)
        : normalizePermissions({});

    return res.json({
      workspace: {
        ...workspace,
        storageQuota: workspace.storageQuota.toString(),
        storageUsed: workspace.storageUsed.toString(),
        isOwner,
        role: isOwner ? 'OWNER' : member?.role || 'MEMBER',
        permissions,
        memberCount: workspace._count.members,
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.ownerId !== userId) {
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: id, OR: [{ userId }, { email: req.user!.email }] },
      });
      const memberPerms = normalizePermissions(member?.permissions);
      if (!member || (!memberPerms.canManagePermissions && member.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Permission denied to edit workspace settings' });
      }
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : workspace.name,
        description: description !== undefined ? description.trim() : workspace.description,
      },
    });

    return res.json({
      workspace: {
        ...updated,
        storageQuota: updated.storageQuota.toString(),
        storageUsed: updated.storageUsed.toString(),
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only workspace owner can delete the workspace' });
    }

    await prisma.workspace.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.get('/:id/members', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const isMember = workspace.ownerId === userId || await prisma.workspaceMember.findFirst({
      where: { workspaceId: id, OR: [{ userId }, { email: userEmail }] },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const serializedMembers = members.map((m) => {
      const normPerms = normalizePermissions(m.permissions);
      return {
        ...m,
        permissions: normPerms,
        ...normPerms,
      };
    });

    return res.json({ members: serializedMembers });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.post('/:id/members', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid member email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.ownerId !== userId) {
      const callerMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId: id, OR: [{ userId }, { email: req.user!.email }] },
      });
      const callerPerms = normalizePermissions(callerMember?.permissions);
      if (!callerMember || (!callerPerms.canManagePermissions && callerMember.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Permission denied to manage workspace members' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const selectedRole = (role || 'MEMBER').toUpperCase();
    const customInput = req.body.permissions && typeof req.body.permissions === 'object' ? req.body.permissions : req.body;
    const resolvedAttrs = resolveRolePermissions(selectedRole, customInput);

    const member = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_email: {
          workspaceId: id,
          email: normalizedEmail,
        },
      },
      create: {
        workspaceId: id,
        userId: existingUser?.id || null,
        email: normalizedEmail,
        role: selectedRole,
        permissions: resolvedAttrs,
        status: 'ACTIVE',
      },
      update: {
        userId: existingUser?.id || undefined,
        role: selectedRole,
        permissions: resolvedAttrs,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const normPerms = normalizePermissions(member.permissions);

    return res.status(201).json({
      member: {
        ...member,
        permissions: normPerms,
        ...normPerms,
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.patch('/:id/members/:memberId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;
    const { role } = req.body;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.ownerId !== userId) {
      const callerMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId: id, OR: [{ userId }, { email: req.user!.email }] },
      });
      const callerPerms = normalizePermissions(callerMember?.permissions);
      if (!callerMember || (!callerPerms.canManagePermissions && callerMember.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Permission denied to update member permissions' });
      }
    }

    const existingMember = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!existingMember || existingMember.workspaceId !== id) {
      return res.status(404).json({ error: 'Member not found in workspace' });
    }

    if (existingMember.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot modify permissions of the workspace owner' });
    }

    const targetRole = role ? role.toUpperCase() : existingMember.role;
    const currentPerms = normalizePermissions(existingMember.permissions);
    const customInput = req.body.permissions && typeof req.body.permissions === 'object' ? req.body.permissions : req.body;

    const mergedAttrs = targetRole === 'CUSTOM'
      ? { ...currentPerms, ...customInput }
      : customInput;

    const resolvedAttrs = resolveRolePermissions(targetRole, mergedAttrs);

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: targetRole,
        permissions: resolvedAttrs,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const normPerms = normalizePermissions(updated.permissions);

    return res.json({
      member: {
        ...updated,
        permissions: normPerms,
        ...normPerms,
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.delete('/:id/members/:memberId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.ownerId !== userId) {
      const callerMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId: id, OR: [{ userId }, { email: req.user!.email }] },
      });
      const callerPerms = normalizePermissions(callerMember?.permissions);
      if (!callerMember || (!callerPerms.canManagePermissions && callerMember.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Permission denied to remove workspace members' });
      }
    }

    const targetMember = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.workspaceId !== id) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return res.json({ success: true, memberId });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

workspaceRouter.get('/:id/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const events = await prisma.changeEvents.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ events });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});
