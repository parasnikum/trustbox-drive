import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';
import { StorageRouter } from '../../infrastructure/router/StorageRouter';
import { StorageManager } from '../../infrastructure/storage/StorageManager';
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus';

export const uploadRouter = Router();
const storageRouter = new StorageRouter();
const storageManager = StorageManager.getInstance();
const eventBus = InMemoryEventBus.getInstance();

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

uploadRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fileName, mimeType, size, parentId, workspaceId } = req.body;

    if (!fileName || !mimeType || size === undefined) {
      return res.status(400).json({ error: 'fileName, mimeType, and size are required' });
    }

    const fileSizeNum = Number(size);

    const { locationId, provider } = storageRouter.selectStorageLocation(fileSizeNum, mimeType);
    const objectKey = `users/${userId}/files/${uuidv4()}/${fileName}`;

    let uploadUrl = '';
    try {
      const signed = await provider.getSignedUploadUrl({
        objectKey,
        mimeType,
        expiresInSeconds: 86400,
      });
      uploadUrl = signed.url;
      storageManager.recordClassAOperation(locationId);
    } catch {
      uploadUrl = '';
    }

    const expiresAt = new Date(Date.now() + 86400 * 1000);
    const session = await prisma.uploadSessions.create({
      data: {
        userId,
        workspaceId: workspaceId || null,
        fileName,
        mimeType,
        size: BigInt(fileSizeNum),
        parentId: parentId || null,
        storageLocationId: locationId,
        storageObjectKey: objectKey,
        uploadUrl,
        expiresAt,
      },
    });

    return res.status(201).json({
      uploadSessionId: session.id,
      storageLocationId: locationId,
      providerName: provider.providerName,
      uploadUrl: session.uploadUrl,
      objectKey,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

uploadRouter.post('/:id/proxy', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  return res.status(400).json({
    error: 'VPS server proxy upload is disabled to save VPS bandwidth. All uploads must use direct pre-signed URLs to Cloudflare R2 / S3 / MinIO.',
  });
});

uploadRouter.post('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { checksum } = req.body;

    const session = await prisma.uploadSessions.findUnique({ where: { id } });
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Upload session not found' });
    }

    if (session.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Upload session already completed' });
    }

    const computedChecksum = checksum || `sha256_${crypto.randomBytes(8).toString('hex')}`;

    await storageManager.syncDatabaseLocations();

    const { storageObject, file, fileVersion, eventRecord } = await prisma.$transaction(async (tx) => {

      const sObj = await tx.storageObjects.create({
        data: {
          storageLocationId: session.storageLocationId,
          objectKey: session.storageObjectKey,
          size: session.size,
          checksum: computedChecksum,
          etag: `etag_${Date.now()}`,
        },
      });

      const f = await tx.files.create({
        data: {
          ownerId: userId,
          workspaceId: session.workspaceId || null,
          parentId: session.parentId,
          name: session.fileName,
          mimeType: session.mimeType,
          size: session.size,
          checksum: computedChecksum,
        },
      });

      const fVer = await tx.fileVersions.create({
        data: {
          fileId: f.id,
          versionNumber: 1,
          storageObjectId: sObj.id,
          size: session.size,
          checksum: computedChecksum,
        },
      });

      await tx.uploadSessions.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      await tx.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: session.size } },
      });

      if (session.workspaceId) {
        await tx.workspace.update({
          where: { id: session.workspaceId },
          data: { storageUsed: { increment: session.size } },
        }).catch(() => { });
      }

      const serializedFile = serialize(f);
      const evt = await tx.changeEvents.create({
        data: {
          userId,
          eventType: 'file.created',
          entityType: 'file',
          entityId: f.id,
          payload: JSON.stringify(serializedFile),
        },
      });

      return { storageObject: sObj, file: f, fileVersion: fVer, eventRecord: evt };
    });

    storageManager.recordClassAOperation(session.storageLocationId);

    const serializedFile = serialize(file);
    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType: 'file.created',
      entityType: 'file',
      entityId: file.id,
      payload: serializedFile,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      file: serializedFile,
      version: serialize(fileVersion),
      storageObject: serialize(storageObject),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
