import { Router, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const syncRouter = Router();

syncRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr_demo_123';
    const cursorStr = req.query.cursor as string;
    const cursor = cursorStr ? parseInt(cursorStr, 10) : 0;

    const events = await prisma.changeEvents.findMany({
      where: {
        userId,
        sequence: { gt: cursor },
      },
      orderBy: { sequence: 'asc' },
      take: 100,
    });

    const parsedEvents = events.map(evt => ({
      eventId: evt.id,
      sequence: evt.sequence,
      userId: evt.userId,
      eventType: evt.eventType,
      entityType: evt.entityType,
      entityId: evt.entityId,
      payload: JSON.parse(evt.payload),
      timestamp: evt.createdAt.toISOString(),
    }));

    const nextCursor = parsedEvents.length > 0 ? parsedEvents[parsedEvents.length - 1].sequence : cursor;

    return res.json({
      events: parsedEvents,
      cursor: nextCursor,
      hasMore: parsedEvents.length === 100,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
