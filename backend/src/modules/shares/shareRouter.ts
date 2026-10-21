import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const shareRouter = Router();

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

shareRouter.get('/shared-with-me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shares = await prisma.shareLinks.findMany({
      where: {
        createdById: { not: userId },
        revokedAt: null,
        OR: [
          { visibility: 'PUBLIC' },
          { members: { some: { email: userEmail } } },
        ],
      },
      include: {
        file: true,
        members: true,
      },
    });

    const sharedFiles = shares
      .filter((s) => s.file && !s.file.isTrash && s.file.ownerId !== userId && s.createdById !== userId)
      .map((s) => {
        const member = s.members.find((m) => userEmail && m.email.toLowerCase() === userEmail.toLowerCase());
        const permission = member ? member.permission : s.permission;
        return {
          ...s.file,
          shareId: s.id,
          shareToken: s.token,
          permission,
          isSharedWithMe: true,
        };
      });

    return res.json({
      files: serialize(sharedFiles),
      folders: [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shareRouter.get('/shared-by-me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const shares = await prisma.shareLinks.findMany({
      where: {
        createdById: userId,
        revokedAt: null,
      },
      include: {
        file: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ shares: serialize(shares) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shareRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const { fileId, folderId, permission, visibility, password, expiresAt } = req.body;

    if (!fileId && !folderId) {
      return res.status(400).json({ error: 'Either fileId or folderId is required' });
    }

    const token = crypto.randomBytes(12).toString('hex');
    let passwordHash = null;
    if (password && password.trim() !== '') {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const share = await prisma.shareLinks.create({
      data: {
        fileId: fileId || null,
        folderId: folderId || null,
        token,
        permission: permission || 'VIEWER',
        visibility: visibility || 'PUBLIC',
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: userId,
      },
      include: {
        file: true,
        members: true,
      },
    });

    return res.status(201).json({ share: serialize(share) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shareRouter.get('/token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const share = await prisma.shareLinks.findUnique({
      where: { token },
      include: { file: true, members: true },
    });

    if (!share || share.revokedAt) {
      return res.status(404).json({ error: 'Share link invalid or revoked' });
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    if (share.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required to access this link', passwordRequired: true });
      }
      const isMatch = await bcrypt.compare(password as string, share.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password', passwordRequired: true });
      }
    }

    return res.json({ share: serialize(share) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shareRouter.post('/:id/members', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, permission } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (req.user?.email && email.trim().toLowerCase() === req.user.email.trim().toLowerCase()) {
      return res.status(400).json({ error: 'You cannot share items with your own account email' });
    }

    const member = await prisma.shareMembers.create({
      data: {
        shareId: id,
        email,
        permission: permission || 'VIEWER',
      },
    });

    return res.status(201).json({ member });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shareRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shareLinks.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
