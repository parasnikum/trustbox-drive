import { Router, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus';

export const folderRouter = Router();
const eventBus = InMemoryEventBus.getInstance();

folderRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const parentId = req.query.parentId === 'null' || !req.query.parentId ? null : (req.query.parentId as string);
    const isTrash = req.query.isTrash === 'true';
    const isStarred = req.query.isStarred === 'true';
    const isRecent = req.query.isRecent === 'true';

    const workspaceId = (req.query.workspaceId as string) || null;

    if (isRecent) {
      return res.json({ folders: [] });
    }

    const whereClause: any = {
      isTrash: isTrash,
    };

    if (workspaceId && workspaceId !== 'null') {
      whereClause.workspaceId = workspaceId;
    } else {
      whereClause.workspaceId = null;
      whereClause.ownerId = userId;
    }

    if (isStarred) {
      whereClause.isStarred = true;
    } else if (!isTrash) {
      whereClause.parentId = parentId;
    }

    const folders = await prisma.folders.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({
      folders: folders.map((f: any) => ({
        ...f,
        ownerEmail: f.owner?.email,
        ownerName: f.owner?.name,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

folderRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const { name, parentId, workspaceId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await prisma.folders.create({
      data: {
        ownerId: userId,
        workspaceId: workspaceId || null,
        parentId: parentId || null,
        name: name.trim(),
        path: parentId ? `/folder/${parentId}` : '/',
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });

    const eventRecord = await prisma.changeEvents.create({
      data: {
        userId,
        eventType: 'folder.created',
        entityType: 'folder',
        entityId: folder.id,
        payload: JSON.stringify(folder),
      },
    });

    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType: 'folder.created',
      entityType: 'folder',
      entityId: folder.id,
      payload: folder,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ folder });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

folderRouter.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const { id } = req.params;
    const { name, parentId, isTrash, isStarred } = req.body;

    const folder = await prisma.folders.findUnique({ where: { id } });
    if (!folder || folder.ownerId !== userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updated = await prisma.folders.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : folder.name,
        parentId: parentId !== undefined ? parentId : folder.parentId,
        isTrash: isTrash !== undefined ? isTrash : folder.isTrash,
        isStarred: isStarred !== undefined ? isStarred : folder.isStarred,
        deletedAt: isTrash ? new Date() : isTrash === false ? null : folder.deletedAt,
      },
    });

    const eventType = isTrash ? 'folder.deleted' : 'folder.updated';
    const eventRecord = await prisma.changeEvents.create({
      data: {
        userId,
        eventType,
        entityType: 'folder',
        entityId: updated.id,
        payload: JSON.stringify(updated),
      },
    });

    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType,
      entityType: 'folder',
      entityId: updated.id,
      payload: updated,
      timestamp: new Date().toISOString(),
    });

    return res.json({ folder: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

folderRouter.post('/:id/trash', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const { id } = req.params;

    const folder = await prisma.folders.findUnique({ where: { id } });
    if (!folder || folder.ownerId !== userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updated = await prisma.folders.update({
      where: { id },
      data: {
        isTrash: true,
        deletedAt: new Date(),
      },
    });

    const eventRecord = await prisma.changeEvents.create({
      data: {
        userId,
        eventType: 'folder.deleted',
        entityType: 'folder',
        entityId: updated.id,
        payload: JSON.stringify(updated),
      },
    });

    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType: 'folder.deleted',
      entityType: 'folder',
      entityId: updated.id,
      payload: updated,
      timestamp: new Date().toISOString(),
    });

    return res.json({ folder: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

folderRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const { id } = req.params;

    const folder = await prisma.folders.findUnique({ where: { id } });
    if (!folder || folder.ownerId !== userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await prisma.folders.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
