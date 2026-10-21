import path from 'path';
import fs from 'fs';
const archiver = require('archiver');
import { Router, Request, Response } from 'express';
import { prisma, handleDatabaseError } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';
import { StorageManager } from '../../infrastructure/storage/StorageManager';
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus';

export const fileRouter = Router();
const storageManager = StorageManager.getInstance();
const eventBus = InMemoryEventBus.getInstance();

function serializeFile(file: any) {
  const latestVersion = file.versions && file.versions.length > 0 ? file.versions[0] : null;
  const storageObj = latestVersion?.storageObject;
  const isCacheValid = storageObj?.cachedDownloadUrl && storageObj?.downloadUrlExpiresAt && new Date(storageObj.downloadUrlExpiresAt).getTime() - Date.now() > 5 * 60 * 1000;

  return {
    ...file,
    size: file.size ? file.size.toString() : '0',
    ownerEmail: file.owner?.email,
    ownerName: file.owner?.name,
    parentPath: file.parent?.path || (file.parentId ? file.parent?.name : '/My files'),
    isShared: (file.shares && file.shares.length > 0) || file.isSharedWithMe || false,
    cachedDownloadUrl: isCacheValid ? storageObj.cachedDownloadUrl : undefined,
    versions: file.versions
      ? file.versions.map((v: any) => ({ ...v, size: v.size ? v.size.toString() : '0' }))
      : undefined,
  };
}

fileRouter.get('/download-direct', async (req: Request, res: Response) => {
  try {
    const objectKey = req.query.key as string;
    if (!objectKey) {
      return res.status(400).json({ error: 'Object key is required' });
    }

    const normalizedKey = path.normalize(objectKey).replace(/^(\.\.[\/\\])+/, '');
    const storageDir = path.resolve('./storage_uploads');
    const targetPath = path.join(storageDir, normalizedKey);

    if (!targetPath.startsWith(storageDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Physical storage file not found' });
    }

    const stat = await fs.promises.stat(targetPath);
    const ext = path.extname(targetPath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.md': 'text/markdown; charset=utf-8',
      '.srt': 'text/plain; charset=utf-8',
      '.vtt': 'text/vtt; charset=utf-8',
      '.csv': 'text/csv; charset=utf-8',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const isInline = req.query.inline === 'true' || req.query.preview === 'true' || req.query.disposition === 'inline';
    const requestedFilename = (req.query.filename as string) || path.basename(normalizedKey);
    const dispositionHeader = `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(requestedFilename)}"`;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Content-Disposition': dispositionHeader,
      };
      res.writeHead(206, head);
      fileStream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      res.on('close', () => fileStream.destroy());
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': dispositionHeader,
      };
      res.writeHead(200, head);
      const fileStream = fs.createReadStream(targetPath);
      fileStream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      res.on('close', () => fileStream.destroy());
      fileStream.pipe(res);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function markStorageDirty(userId: string) {
  try {
    await prisma.userStorageAnalytics.upsert({
      where: { userId },
      create: { userId, isDirty: true },
      update: { isDirty: true },
    });
  } catch (err) {
    console.error('Failed to mark storage dirty:', err);
  }
}

fileRouter.get('/storage/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const forceRefresh = req.query.forceRefresh === 'true';

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const quotaBytes = BigInt(user.storageQuota || '2147483648');

    const cachedAnalytics = await prisma.userStorageAnalytics.findUnique({
      where: { userId },
    });

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const now = Date.now();
    const isExpired = !cachedAnalytics || (now - cachedAnalytics.lastCalculated.getTime() > FIVE_MINUTES_MS);
    const shouldRecompute = forceRefresh || !cachedAnalytics || (cachedAnalytics.isDirty && isExpired);

    let totalUsedBytes = BigInt(0);
    let docsBytes = BigInt(0);
    let photosBytes = BigInt(0);
    let videosBytes = BigInt(0);
    let otherBytes = BigInt(0);
    let totalFileCount = 0;

    if (shouldRecompute) {
      const files = await prisma.files.findMany({
        where: {
          ownerId: userId,
          isTrash: false,
        },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
        },
      });

      totalFileCount = files.length;

      for (const f of files) {
        const s = BigInt(f.size || 0);
        totalUsedBytes += s;

        const mime = (f.mimeType || '').toLowerCase();
        const ext = f.name.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';

        if (
          mime.startsWith('image/') ||
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
        ) {
          photosBytes += s;
        } else if (
          mime.startsWith('video/') ||
          ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)
        ) {
          videosBytes += s;
        } else if (
          mime.startsWith('text/') ||
          mime.includes('pdf') ||
          mime.includes('word') ||
          mime.includes('document') ||
          mime.includes('sheet') ||
          mime.includes('excel') ||
          mime.includes('presentation') ||
          mime.includes('csv') ||
          mime.includes('json') ||
          mime.includes('xml') ||
          ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'js', 'ts', 'py', 'html', 'css', 'json'].includes(ext)
        ) {
          docsBytes += s;
        } else {
          otherBytes += s;
        }
      }

      await prisma.userStorageAnalytics.upsert({
        where: { userId },
        create: {
          userId,
          documentsBytes: docsBytes,
          photosBytes: photosBytes,
          videosBytes: videosBytes,
          otherBytes: otherBytes,
          totalUsedBytes: totalUsedBytes,
          totalFileCount,
          isDirty: false,
          lastCalculated: new Date(),
        },
        update: {
          documentsBytes: docsBytes,
          photosBytes: photosBytes,
          videosBytes: videosBytes,
          otherBytes: otherBytes,
          totalUsedBytes: totalUsedBytes,
          totalFileCount,
          isDirty: false,
          lastCalculated: new Date(),
        },
      });

      if (user.storageUsed !== totalUsedBytes) {
        await prisma.user.update({
          where: { id: userId },
          data: { storageUsed: totalUsedBytes },
        });
      }
    } else {
      docsBytes = cachedAnalytics.documentsBytes;
      photosBytes = cachedAnalytics.photosBytes;
      videosBytes = cachedAnalytics.videosBytes;
      otherBytes = cachedAnalytics.otherBytes;
      totalUsedBytes = cachedAnalytics.totalUsedBytes;
      totalFileCount = cachedAnalytics.totalFileCount;
    }

    const usedNum = Number(totalUsedBytes);
    const quotaNum = Number(quotaBytes);
    const availableNum = Math.max(0, quotaNum - usedNum);
    const percentage = quotaNum > 0 ? Math.min(100, Math.round((usedNum / quotaNum) * 100)) : 0;

    const formatGB = (b: number) => (b / (1024 * 1024 * 1024)).toFixed(2);
    const formatSmartSize = (b: number) => {
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
      return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const docsNum = Number(docsBytes);
    const photosNum = Number(photosBytes);
    const videosNum = Number(videosBytes);
    const otherNum = Number(otherBytes);

    return res.json({
      storageQuota: quotaBytes.toString(),
      storageUsed: totalUsedBytes.toString(),
      availableBytes: BigInt(availableNum).toString(),
      usedGB: formatGB(usedNum),
      quotaGB: formatGB(quotaNum),
      availableGB: formatGB(availableNum),
      usedDisplay: formatSmartSize(usedNum),
      quotaDisplay: formatSmartSize(quotaNum),
      availableDisplay: formatSmartSize(availableNum),
      percentage,
      totalFileCount,
      isCached: !shouldRecompute,
      lastCalculated: shouldRecompute ? new Date() : cachedAnalytics?.lastCalculated,
      categories: [
        {
          id: 'documents',
          name: 'Documents',
          bytes: docsBytes.toString(),
          displaySize: formatSmartSize(docsNum),
          gb: formatGB(docsNum),
          percentage: usedNum > 0 ? Math.round((docsNum / usedNum) * 100) : 0,
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          borderColor: 'border-blue-500',
        },
        {
          id: 'photos',
          name: 'Photos',
          bytes: photosBytes.toString(),
          displaySize: formatSmartSize(photosNum),
          gb: formatGB(photosNum),
          percentage: usedNum > 0 ? Math.round((photosNum / usedNum) * 100) : 0,
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500',
          borderColor: 'border-emerald-500',
        },
        {
          id: 'videos',
          name: 'Videos',
          bytes: videosBytes.toString(),
          displaySize: formatSmartSize(videosNum),
          gb: formatGB(videosNum),
          percentage: usedNum > 0 ? Math.round((videosNum / usedNum) * 100) : 0,
          color: 'bg-purple-500',
          textColor: 'text-purple-500',
          borderColor: 'border-purple-500',
        },
        {
          id: 'other',
          name: 'Other',
          bytes: otherBytes.toString(),
          displaySize: formatSmartSize(otherNum),
          gb: formatGB(otherNum),
          percentage: usedNum > 0 ? Math.round((otherNum / usedNum) * 100) : 0,
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          borderColor: 'border-amber-500',
        },
      ],
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/storage/upgrade', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, addGB, targetGB } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let targetBytes = user.storageQuota;

    if (addGB !== undefined && !isNaN(Number(addGB)) && Number(addGB) >= 5) {
      const validAddGB = Math.max(5, Math.floor(Number(addGB)));
      const bytesToAdd = BigInt(validAddGB) * BigInt(1073741824);
      targetBytes = user.storageQuota + bytesToAdd;
    } else if (targetGB && typeof targetGB === 'number' && targetGB > 0) {
      const validTargetGB = Math.max(2, Math.round(targetGB / 5) * 5);
      targetBytes = BigInt(validTargetGB) * BigInt(1073741824);
    } else if (planId === 'free' || planId === '2gb') {
      targetBytes = BigInt(2147483648);
    } else if (planId === 'starter' || planId === '100gb') {
      targetBytes = BigInt(107374182400);
    } else if (planId === 'pro' || planId === '1tb') {
      targetBytes = BigInt(1073741824000);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { storageQuota: targetBytes },
    });

    await markStorageDirty(userId);

    return res.json({
      success: true,
      message: 'Storage quota updated successfully',
      user: {
        ...updatedUser,
        role: updatedUser.role || 'USER',
        storageQuota: updatedUser.storageQuota.toString(),
        storageUsed: updatedUser.storageUsed.toString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

fileRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parentId = req.query.parentId === 'null' || !req.query.parentId ? null : (req.query.parentId as string);
    const isTrash = req.query.isTrash === 'true';
    const isStarred = req.query.isStarred === 'true';
    const isRecent = req.query.isRecent === 'true';
    const search = req.query.search as string;
    const typeFilter = req.query.typeFilter as string;
    const dateFilter = req.query.dateFilter as string;
    const workspaceIdParam = (req.query.workspaceId as string) || null;

    const whereClause: any = {
      isTrash: isTrash,
    };

    if (workspaceIdParam && workspaceIdParam !== 'null') {
      whereClause.workspaceId = workspaceIdParam;
    } else {
      whereClause.workspaceId = null;
      whereClause.ownerId = userId;
    }

    if (isStarred) {
      whereClause.isStarred = true;
    } else if (isRecent) {

    } else if (search && search.trim() !== '') {
      whereClause.name = { contains: search.trim(), mode: 'insensitive' };
    } else if (!isTrash) {
      whereClause.parentId = parentId;
    }

    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'image') {
        whereClause.OR = [
          { mimeType: { startsWith: 'image/' } },
          { name: { endsWith: '.jpg', mode: 'insensitive' } },
          { name: { endsWith: '.jpeg', mode: 'insensitive' } },
          { name: { endsWith: '.png', mode: 'insensitive' } },
          { name: { endsWith: '.gif', mode: 'insensitive' } },
          { name: { endsWith: '.webp', mode: 'insensitive' } },
          { name: { endsWith: '.svg', mode: 'insensitive' } },
          { name: { endsWith: '.bmp', mode: 'insensitive' } },
          { name: { endsWith: '.heic', mode: 'insensitive' } },
        ];
      } else if (typeFilter === 'video') {
        whereClause.OR = [
          { mimeType: { startsWith: 'video/' } },
          { name: { endsWith: '.mp4', mode: 'insensitive' } },
          { name: { endsWith: '.webm', mode: 'insensitive' } },
          { name: { endsWith: '.mov', mode: 'insensitive' } },
          { name: { endsWith: '.avi', mode: 'insensitive' } },
          { name: { endsWith: '.mkv', mode: 'insensitive' } },
        ];
      } else if (typeFilter === 'audio') {
        whereClause.OR = [
          { mimeType: { startsWith: 'audio/' } },
          { name: { endsWith: '.mp3', mode: 'insensitive' } },
          { name: { endsWith: '.wav', mode: 'insensitive' } },
          { name: { endsWith: '.ogg', mode: 'insensitive' } },
          { name: { endsWith: '.m4a', mode: 'insensitive' } },
        ];
      } else if (typeFilter === 'pdf') {
        whereClause.OR = [
          { mimeType: { contains: 'pdf' } },
          { name: { endsWith: '.pdf', mode: 'insensitive' } },
        ];
      } else if (typeFilter === 'document') {
        whereClause.OR = [
          { mimeType: { contains: 'document' } },
          { mimeType: { contains: 'word' } },
          { mimeType: { contains: 'sheet' } },
          { mimeType: { contains: 'excel' } },
          { mimeType: { startsWith: 'text/' } },
          { mimeType: { contains: 'csv' } },
          { name: { endsWith: '.doc', mode: 'insensitive' } },
          { name: { endsWith: '.docx', mode: 'insensitive' } },
          { name: { endsWith: '.xls', mode: 'insensitive' } },
          { name: { endsWith: '.xlsx', mode: 'insensitive' } },
          { name: { endsWith: '.ppt', mode: 'insensitive' } },
          { name: { endsWith: '.pptx', mode: 'insensitive' } },
          { name: { endsWith: '.txt', mode: 'insensitive' } },
          { name: { endsWith: '.csv', mode: 'insensitive' } },
        ];
      } else if (typeFilter === 'code') {
        whereClause.OR = [
          { mimeType: { contains: 'javascript' } },
          { mimeType: { contains: 'json' } },
          { mimeType: { contains: 'xml' } },
          { mimeType: { contains: 'html' } },
          { mimeType: { contains: 'text/' } },
          { name: { endsWith: '.js', mode: 'insensitive' } },
          { name: { endsWith: '.ts', mode: 'insensitive' } },
          { name: { endsWith: '.py', mode: 'insensitive' } },
          { name: { endsWith: '.json', mode: 'insensitive' } },
          { name: { endsWith: '.html', mode: 'insensitive' } },
          { name: { endsWith: '.css', mode: 'insensitive' } },
          { name: { endsWith: '.md', mode: 'insensitive' } },
        ];
      }
    }

    if (dateFilter && dateFilter !== 'all') {
      let durationMs = 0;
      if (dateFilter === '24h') durationMs = 24 * 60 * 60 * 1000;
      else if (dateFilter === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
      else if (dateFilter === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

      if (durationMs > 0) {
        whereClause.updatedAt = { gte: new Date(Date.now() - durationMs) };
      }
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const limit = limitQuery ? Math.min(100, Math.max(1, limitQuery)) : (isRecent ? 50 : undefined);
    const skip = limit && isPaginated ? (page - 1) * limit : undefined;

    const [totalCount, files] = await Promise.all([
      prisma.files.count({ where: whereClause }),
      prisma.files.findMany({
        where: whereClause,
        include: {
          versions: true,
          owner: { select: { id: true, email: true, name: true } },
          parent: { select: { id: true, name: true, path: true } },
          shares: { select: { id: true, token: true, permission: true } },
        },
        orderBy: isRecent ? { updatedAt: 'desc' } : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const serializedFiles = files.map(serializeFile);
    const hasMore = limit ? (skip || 0) + files.length < totalCount : false;

    return res.json({
      files: serializedFiles,
      totalCount,
      hasMore,
      page,
      limit: limit || totalCount,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await prisma.files.findUnique({
      where: { id },
      include: {
        versions: { include: { storageObject: true } },
        owner: { select: { id: true, email: true, name: true } },
        parent: { select: { id: true, name: true, path: true } },
        shares: { select: { id: true, token: true, permission: true } },
      },
    });

    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.json({ file: serializeFile(file) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.get('/:id/presigned-url', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isInline = req.query.inline === 'true' || req.query.preview === 'true';

    const file = await prisma.files.findFirst({
      where: {
        OR: [
          { id: id },
          { versions: { some: { id: id } } },
          { versions: { some: { storageObjectId: id } } },
        ],
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { storageObject: true },
        },
      },
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    const latestVersion = file.versions[0];
    if (!latestVersion || !latestVersion.storageObject) {
      return res.status(404).json({ error: 'File version metadata missing' });
    }

    const presignedResult = await storageManager.getOrGeneratePresignedDownloadUrl(
      latestVersion.storageObject.id,
      file.name,
      isInline,
      86400
    );

    return res.json({
      downloadUrl: presignedResult.url,
      expiresAt: presignedResult.expiresAt,
      isCached: presignedResult.isCached,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.get('/:id/download', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isInline = req.query.inline === 'true' || req.query.preview === 'true' || req.query.disposition === 'inline';
    const range = req.headers.range;

    let file = await prisma.files.findFirst({
      where: {
        OR: [
          { id: id },
          { versions: { some: { id: id } } },
          { versions: { some: { storageObjectId: id } } },
        ],
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { storageObject: true },
        },
      },
    });

    if (!file) {
      const session = await prisma.uploadSessions.findUnique({ where: { id: id } });
      if (session) {
        file = await prisma.files.findFirst({
          where: {
            ownerId: session.userId,
            name: session.fileName,
          },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
              include: { storageObject: true },
            },
          },
        });
      }
    }

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const latestVersion = file.versions[0];
    if (!latestVersion || !latestVersion.storageObject) {
      return res.status(404).json({ error: 'File version metadata missing' });
    }

    const storageObj = latestVersion.storageObject;

    if (req.query.presigned === 'true' || req.query.redirect === 'true' || req.query.json === 'true') {
      const presignedResult = await storageManager.getOrGeneratePresignedDownloadUrl(
        storageObj.id,
        file.name,
        isInline,
        86400
      );

      if (req.query.redirect === 'true') {
        return res.redirect(302, presignedResult.url);
      }

      return res.json({
        downloadUrl: presignedResult.url,
        isCached: presignedResult.isCached,
        expiresAt: presignedResult.expiresAt,
      });
    }

    const provider = storageManager.getProvider(storageObj.storageLocationId);
    const downloadRes = await provider.download(storageObj.objectKey, range);

    storageManager.recordClassBOperation(storageObj.storageLocationId);

    const dispositionHeader = `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.name)}"`;
    const mimeType = file.mimeType || 'application/octet-stream';

    if (range && downloadRes.contentRange) {
      res.writeHead(206, {
        'Content-Range': downloadRes.contentRange,
        'Accept-Ranges': 'bytes',
        'Content-Length': downloadRes.contentLength || 0,
        'Content-Type': mimeType,
        'Content-Disposition': dispositionHeader,
      });
    } else {
      res.writeHead(200, {
        'Content-Length': downloadRes.contentLength || Number(file.size),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': dispositionHeader,
      });
    }

    if (downloadRes.stream) {
      downloadRes.stream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      res.on('close', () => {
        if (typeof (downloadRes.stream as any).destroy === 'function') {
          (downloadRes.stream as any).destroy();
        }
      });
      downloadRes.stream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/:id/move', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { targetParentId } = req.body;

    const file = await prisma.files.findUnique({ where: { id } });
    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updated = await prisma.files.update({
      where: { id },
      data: { parentId: targetParentId || null },
    });

    return res.json({ file: serializeFile(updated) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/:id/copy', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { targetParentId } = req.body;

    const file = await prisma.files.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const latestVersion = file.versions[0];
    if (!latestVersion) {
      return res.status(400).json({ error: 'File version missing' });
    }

    const newFileName = `Copy of ${file.name}`;

    const newFile = await prisma.$transaction(async (tx) => {
      const f = await tx.files.create({
        data: {
          ownerId: userId,
          parentId: targetParentId || file.parentId,
          name: newFileName,
          mimeType: file.mimeType,
          size: file.size,
          checksum: file.checksum,
        },
      });

      await tx.fileVersions.create({
        data: {
          fileId: f.id,
          versionNumber: 1,
          storageObjectId: latestVersion.storageObjectId,
          size: file.size,
          checksum: file.checksum,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: file.size } },
      });

      return f;
    });

    return res.status(201).json({ file: serializeFile(newFile) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, parentId, isTrash, isStarred } = req.body;

    const file = await prisma.files.findUnique({ where: { id } });
    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updated = await prisma.files.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : file.name,
        parentId: parentId !== undefined ? parentId : file.parentId,
        isTrash: isTrash !== undefined ? isTrash : file.isTrash,
        isStarred: isStarred !== undefined ? isStarred : file.isStarred,
        deletedAt: isTrash ? new Date() : isTrash === false ? null : file.deletedAt,
      },
    });

    const eventType = isTrash ? 'file.deleted' : 'file.updated';
    const eventRecord = await prisma.changeEvents.create({
      data: {
        userId,
        eventType,
        entityType: 'file',
        entityId: updated.id,
        payload: JSON.stringify(serializeFile(updated)),
      },
    });

    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType,
      entityType: 'file',
      entityId: updated.id,
      payload: serializeFile(updated),
      timestamp: new Date().toISOString(),
    });

    return res.json({ file: serializeFile(updated) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/:id/trash', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await prisma.files.findUnique({ where: { id } });
    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updated = await prisma.files.update({
      where: { id },
      data: {
        isTrash: true,
        deletedAt: new Date(),
      },
    });

    const eventRecord = await prisma.changeEvents.create({
      data: {
        userId,
        eventType: 'file.deleted',
        entityType: 'file',
        entityId: updated.id,
        payload: JSON.stringify(serializeFile(updated)),
      },
    });

    await eventBus.publish({
      eventId: eventRecord.id,
      sequence: eventRecord.sequence,
      userId,
      eventType: 'file.deleted',
      entityType: 'file',
      entityId: updated.id,
      payload: serializeFile(updated),
      timestamp: new Date().toISOString(),
    });

    return res.json({ file: serializeFile(updated) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await prisma.files.findUnique({
      where: { id },
      include: { versions: { include: { storageObject: true } } },
    });

    if (!file || file.ownerId !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    for (const version of file.versions) {
      if (version.storageObject) {
        const provider = storageManager.getProvider(version.storageObject.storageLocationId);
        await provider.delete(version.storageObject.objectKey).catch(e => console.error(e));
        storageManager.recordClassAOperation(version.storageObject.storageLocationId);
      }
    }

    await prisma.files.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/trash/empty', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const trashedFiles = await prisma.files.findMany({
      where: { ownerId: userId, isTrash: true },
      include: { versions: { include: { storageObject: true } } },
    });

    let freedBytes = BigInt(0);

    for (const file of trashedFiles) {
      freedBytes += file.size;
      for (const version of file.versions) {
        if (version.storageObject) {
          const provider = storageManager.getProvider(version.storageObject.storageLocationId);
          await provider.delete(version.storageObject.objectKey).catch(e => console.error(e));
          storageManager.recordClassAOperation(version.storageObject.storageLocationId);
        }
      }
    }

    await prisma.files.deleteMany({ where: { ownerId: userId, isTrash: true } });
    await prisma.folders.deleteMany({ where: { ownerId: userId, isTrash: true } });

    if (freedBytes > BigInt(0)) {
      await prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { decrement: freedBytes } },
      }).catch(() => { });
    }

    return res.json({ success: true, deletedCount: trashedFiles.length });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/bulk-delete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items } = req.body as { items: Array<{ type?: 'file' | 'folder'; isFolder?: boolean; id: string }> };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const fileIds = items.filter(i => i.type === 'file' || i.isFolder === false).map(i => i.id);
    const folderIds = items.filter(i => i.type === 'folder' || i.isFolder === true).map(i => i.id);

    if (fileIds.length > 0) {
      const files = await prisma.files.findMany({
        where: { id: { in: fileIds }, ownerId: userId },
        include: { versions: { include: { storageObject: true } } },
      });

      let freedBytes = BigInt(0);
      for (const file of files) {
        freedBytes += file.size;
        for (const version of file.versions) {
          if (version.storageObject) {
            const provider = storageManager.getProvider(version.storageObject.storageLocationId);
            await provider.delete(version.storageObject.objectKey).catch(e => console.error(e));
            storageManager.recordClassAOperation(version.storageObject.storageLocationId);
          }
        }
      }

      await prisma.files.deleteMany({ where: { id: { in: fileIds }, ownerId: userId } });
      if (freedBytes > BigInt(0)) {
        await prisma.user.update({
          where: { id: userId },
          data: { storageUsed: { decrement: freedBytes } },
        }).catch(() => { });
      }
    }

    if (folderIds.length > 0) {
      await prisma.folders.deleteMany({ where: { id: { in: folderIds }, ownerId: userId } });
    }

    return res.json({ success: true });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/bulk-restore', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items } = req.body as { items: Array<{ type?: 'file' | 'folder'; isFolder?: boolean; id: string }> };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const fileIds = items.filter(i => i.type === 'file' || i.isFolder === false).map(i => i.id);
    const folderIds = items.filter(i => i.type === 'folder' || i.isFolder === true).map(i => i.id);

    if (fileIds.length > 0) {
      await prisma.files.updateMany({
        where: { id: { in: fileIds }, ownerId: userId },
        data: { isTrash: false, deletedAt: null },
      });
    }

    if (folderIds.length > 0) {
      await prisma.folders.updateMany({
        where: { id: { in: folderIds }, ownerId: userId },
        data: { isTrash: false, deletedAt: null },
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/bulk-trash', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items } = req.body as { items: Array<{ type?: 'file' | 'folder'; isFolder?: boolean; id: string }> };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const fileIds = items.filter(i => i.type === 'file' || i.isFolder === false).map(i => i.id);
    const folderIds = items.filter(i => i.type === 'folder' || i.isFolder === true).map(i => i.id);

    if (fileIds.length > 0) {
      await prisma.files.updateMany({
        where: { id: { in: fileIds }, ownerId: userId },
        data: { isTrash: true, deletedAt: new Date() },
      });
    }

    if (folderIds.length > 0) {
      await prisma.folders.updateMany({
        where: { id: { in: folderIds }, ownerId: userId },
        data: { isTrash: true, deletedAt: new Date() },
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/bulk-move', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items, targetParentId } = req.body as { items: Array<{ type?: 'file' | 'folder'; isFolder?: boolean; id: string }>; targetParentId: string | null };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const fileIds = items.filter(i => i.type === 'file' || i.isFolder === false).map(i => i.id);
    const folderIds = items.filter(i => i.type === 'folder' || i.isFolder === true).map(i => i.id);

    if (fileIds.length > 0) {
      await prisma.files.updateMany({
        where: { id: { in: fileIds }, ownerId: userId },
        data: { parentId: targetParentId },
      });
    }

    if (folderIds.length > 0) {
      await prisma.folders.updateMany({
        where: { id: { in: folderIds }, ownerId: userId },
        data: { parentId: targetParentId },
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/batch-download', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fileIds } = req.body as { fileIds: string[] };

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'At least one file ID is required' });
    }

    const files = await prisma.files.findMany({
      where: { id: { in: fileIds }, ownerId: userId, isTrash: false },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { storageObject: true },
        },
      },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found to download' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="TrustBox-Download-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err: any) => {
      console.error('[batch-download] Archiver error:', err);
      if (!res.headersSent) res.status(500).end();
    });
    res.on('close', () => {
      try {
        archive.abort();
      } catch {

      }
    });
    archive.pipe(res);

    for (const file of files) {
      const latestVer = file.versions[0];
      if (latestVer?.storageObject) {
        const objectKey = latestVer.storageObject.objectKey;
        const localStoragePath = path.resolve('./storage_uploads', objectKey);
        if (fs.existsSync(localStoragePath)) {
          archive.file(localStoragePath, { name: file.name });
        }
      }
    }

    await archive.finalize();
  } catch (err: any) {
    if (!res.headersSent) {
      const dbErr = handleDatabaseError(err);
      return res.status(dbErr.status).json({ error: dbErr.message });
    }
  }
});

fileRouter.get('/:id/versions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await prisma.files.findFirst({
      where: { id, ownerId: userId },
      include: {
        versions: {
          include: { storageObject: true },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const serializedVersions = file.versions.map((v) => ({
      ...v,
      size: v.size ? v.size.toString() : '0',
    }));

    return res.json({ versions: serializedVersions });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

fileRouter.post('/:id/versions/:versionId/restore', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, versionId } = req.params;

    const file = await prisma.files.findFirst({
      where: { id, ownerId: userId },
      include: { versions: true },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const targetVersion = file.versions.find((v) => v.id === versionId);
    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const updated = await prisma.files.update({
      where: { id },
      data: {
        size: targetVersion.size,
        checksum: targetVersion.checksum,
        updatedAt: new Date(),
      },
    });

    return res.json({ success: true, file: serializeFile(updated) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});
