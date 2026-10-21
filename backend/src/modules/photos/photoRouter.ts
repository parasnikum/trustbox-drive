import fs from 'fs';
import path from 'path';
import { Router, Response } from 'express';
import { prisma, handleDatabaseError } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const photoRouter = Router();

const DATA_DIR = path.resolve(__dirname, '../../../data');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');

export interface PhotoAlbum {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  description: string;
  coverFileId: string | null;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
}

let albumsCache: PhotoAlbum[] = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ALBUMS_FILE)) {
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function loadAlbums(): PhotoAlbum[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    albumsCache = JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to load albums.json:', err);
    albumsCache = [];
  }
  return albumsCache;
}

function saveAlbums() {
  try {
    ensureDataDir();
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save albums.json:', err);
  }
}

loadAlbums();

function serializePhotoFile(file: any) {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  const isVideo = file.mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size ? file.size.toString() : '0',
    isStarred: Boolean(file.isStarred),
    isTrash: Boolean(file.isTrash),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    parentId: file.parentId,
    ownerId: file.ownerId,
    isVideo,
    isImage: !isVideo,
    previewUrl: `/api/files/${file.id}/download?inline=true`,
    downloadUrl: `/api/files/${file.id}/download`,
  };
}

const MEDIA_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'];

photoRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const filter = (req.query.filter as string) || 'all';
    const search = (req.query.search as string) || '';
    const albumId = (req.query.albumId as string) || '';
    const workspaceIdParam = (req.query.workspaceId as string) || null;

    const whereClause: any = {
      isTrash: false,
    };

    if (workspaceIdParam && workspaceIdParam !== 'null') {
      whereClause.workspaceId = workspaceIdParam;
    } else {
      whereClause.workspaceId = null;
      whereClause.ownerId = userId;
    }

    if (filter === 'favorites') {
      whereClause.isStarred = true;
    }

    const imageConditions = [
      { mimeType: { startsWith: 'image/' } },
      { name: { endsWith: '.jpg', mode: 'insensitive' as const } },
      { name: { endsWith: '.jpeg', mode: 'insensitive' as const } },
      { name: { endsWith: '.png', mode: 'insensitive' as const } },
      { name: { endsWith: '.gif', mode: 'insensitive' as const } },
      { name: { endsWith: '.webp', mode: 'insensitive' as const } },
      { name: { endsWith: '.svg', mode: 'insensitive' as const } },
      { name: { endsWith: '.bmp', mode: 'insensitive' as const } },
      { name: { endsWith: '.heic', mode: 'insensitive' as const } },
      { name: { endsWith: '.heif', mode: 'insensitive' as const } },
      { name: { endsWith: '.ico', mode: 'insensitive' as const } },
    ];

    const videoConditions = [
      { mimeType: { startsWith: 'video/' } },
      { name: { endsWith: '.mp4', mode: 'insensitive' as const } },
      { name: { endsWith: '.webm', mode: 'insensitive' as const } },
      { name: { endsWith: '.mov', mode: 'insensitive' as const } },
      { name: { endsWith: '.avi', mode: 'insensitive' as const } },
      { name: { endsWith: '.mkv', mode: 'insensitive' as const } },
      { name: { endsWith: '.m4v', mode: 'insensitive' as const } },
    ];

    if (filter === 'photos') {
      whereClause.OR = imageConditions;
    } else if (filter === 'videos') {
      whereClause.OR = videoConditions;
    } else {

      whereClause.OR = [...imageConditions, ...videoConditions];
    }

    if (search && search.trim() !== '') {
      whereClause.name = { contains: search.trim(), mode: 'insensitive' };
    }

    if (albumId) {
      const album = albumsCache.find(
        (a) => a.id === albumId && (a.userId === userId || a.workspaceId === workspaceIdParam)
      );
      if (!album) {
        return res.status(404).json({ error: 'Album not found' });
      }
      whereClause.id = { in: album.fileIds };
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const limit = limitQuery ? Math.min(100, Math.max(1, limitQuery)) : (isPaginated ? 30 : 500);
    const skip = isPaginated ? (page - 1) * limit : undefined;

    const [totalCount, files] = await Promise.all([
      prisma.files.count({ where: whereClause }),
      prisma.files.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const serialized = files.map(serializePhotoFile);
    const hasMore = (skip || 0) + files.length < totalCount;

    return res.json({
      photos: serialized,
      totalCount,
      hasMore,
      page,
      limit,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

photoRouter.get('/timeline', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceIdParam = (req.query.workspaceId as string) || null;

    const whereClause: any = {
      isTrash: false,
      OR: [
        { mimeType: { startsWith: 'image/' } },
        { mimeType: { startsWith: 'video/' } },
        { name: { endsWith: '.jpg', mode: 'insensitive' as const } },
        { name: { endsWith: '.jpeg', mode: 'insensitive' as const } },
        { name: { endsWith: '.png', mode: 'insensitive' as const } },
        { name: { endsWith: '.gif', mode: 'insensitive' as const } },
        { name: { endsWith: '.webp', mode: 'insensitive' as const } },
        { name: { endsWith: '.svg', mode: 'insensitive' as const } },
        { name: { endsWith: '.bmp', mode: 'insensitive' as const } },
        { name: { endsWith: '.heic', mode: 'insensitive' as const } },
        { name: { endsWith: '.heif', mode: 'insensitive' as const } },
        { name: { endsWith: '.mp4', mode: 'insensitive' as const } },
        { name: { endsWith: '.webm', mode: 'insensitive' as const } },
        { name: { endsWith: '.mov', mode: 'insensitive' as const } },
        { name: { endsWith: '.avi', mode: 'insensitive' as const } },
        { name: { endsWith: '.mkv', mode: 'insensitive' as const } },
        { name: { endsWith: '.m4v', mode: 'insensitive' as const } },
      ],
    };

    if (workspaceIdParam && workspaceIdParam !== 'null') {
      whereClause.workspaceId = workspaceIdParam;
    } else {
      whereClause.workspaceId = null;
      whereClause.ownerId = userId;
    }

    const files = await prisma.files.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const serialized = files.map(serializePhotoFile);

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const groupsMap = new Map<string, any[]>();

    for (const f of serialized) {
      const d = new Date(f.createdAt);
      let label: string;

      if (d.toDateString() === todayStr) {
        label = 'Today';
      } else if (d.toDateString() === yesterdayStr) {
        label = 'Yesterday';
      } else {
        const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        label = monthYear;
      }

      if (!groupsMap.has(label)) {
        groupsMap.set(label, []);
      }
      groupsMap.get(label)!.push(f);
    }

    const timeline = Array.from(groupsMap.entries()).map(([label, items]) => ({
      label,
      date: items[0]?.createdAt,
      count: items.length,
      items,
    }));

    const photosCount = serialized.filter((f) => f.isImage).length;
    const videosCount = serialized.filter((f) => f.isVideo).length;
    const favoritesCount = serialized.filter((f) => f.isStarred).length;

    return res.json({
      timeline,
      stats: {
        totalCount: serialized.length,
        photosCount,
        videosCount,
        favoritesCount,
      },
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

photoRouter.get('/albums', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceIdParam = (req.query.workspaceId as string) || null;

    loadAlbums();

    const userAlbums = albumsCache.filter(
      (a) => (workspaceIdParam ? a.workspaceId === workspaceIdParam : a.userId === userId)
    );

    const populatedAlbums = await Promise.all(
      userAlbums.map(async (album) => {
        let coverFileId = album.coverFileId || (album.fileIds.length > 0 ? album.fileIds[0] : null);
        let coverUrl: string | null = null;

        if (coverFileId) {
          coverUrl = `/api/files/${coverFileId}/download?inline=true`;
        }

        return {
          ...album,
          itemCount: album.fileIds.length,
          coverFileId,
          coverUrl,
        };
      })
    );

    return res.json({ albums: populatedAlbums });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.post('/albums', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description = '', fileIds = [], workspaceId = null } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Album name is required' });
    }

    loadAlbums();

    const newAlbum: PhotoAlbum = {
      id: `alb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: workspaceId || null,
      name: name.trim(),
      description: description ? description.trim() : '',
      coverFileId: fileIds.length > 0 ? fileIds[0] : null,
      fileIds: Array.isArray(fileIds) ? Array.from(new Set(fileIds)) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    albumsCache.unshift(newAlbum);
    saveAlbums();

    return res.status(201).json({
      album: {
        ...newAlbum,
        itemCount: newAlbum.fileIds.length,
        coverUrl: newAlbum.coverFileId ? `/api/files/${newAlbum.coverFileId}/download?inline=true` : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.get('/albums/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    loadAlbums();
    const album = albumsCache.find((a) => a.id === id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const files = await prisma.files.findMany({
      where: {
        id: { in: album.fileIds },
        isTrash: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    const serializedFiles = files.map(serializePhotoFile);

    return res.json({
      album: {
        ...album,
        itemCount: serializedFiles.length,
        coverUrl: album.coverFileId ? `/api/files/${album.coverFileId}/download?inline=true` : (serializedFiles[0]?.previewUrl || null),
        files: serializedFiles,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.patch('/albums/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, coverFileId } = req.body;

    loadAlbums();
    const index = albumsCache.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (name !== undefined && name.trim()) {
      albumsCache[index].name = name.trim();
    }
    if (description !== undefined) {
      albumsCache[index].description = description.trim();
    }
    if (coverFileId !== undefined) {
      albumsCache[index].coverFileId = coverFileId;
    }
    albumsCache[index].updatedAt = new Date().toISOString();

    saveAlbums();

    return res.json({ album: albumsCache[index] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.post('/albums/:id/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'fileIds array is required' });
    }

    loadAlbums();
    const index = albumsCache.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const existingSet = new Set(albumsCache[index].fileIds);
    for (const fid of fileIds) {
      existingSet.add(fid);
    }

    albumsCache[index].fileIds = Array.from(existingSet);
    if (!albumsCache[index].coverFileId && albumsCache[index].fileIds.length > 0) {
      albumsCache[index].coverFileId = albumsCache[index].fileIds[0];
    }
    albumsCache[index].updatedAt = new Date().toISOString();

    saveAlbums();

    return res.json({
      album: albumsCache[index],
      addedCount: fileIds.length,
      totalCount: albumsCache[index].fileIds.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.delete('/albums/:id/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'fileIds array is required' });
    }

    loadAlbums();
    const index = albumsCache.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const removeSet = new Set(fileIds);
    albumsCache[index].fileIds = albumsCache[index].fileIds.filter((fid) => !removeSet.has(fid));

    if (albumsCache[index].coverFileId && removeSet.has(albumsCache[index].coverFileId!)) {
      albumsCache[index].coverFileId = albumsCache[index].fileIds[0] || null;
    }
    albumsCache[index].updatedAt = new Date().toISOString();

    saveAlbums();

    return res.json({
      album: albumsCache[index],
      totalCount: albumsCache[index].fileIds.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

photoRouter.delete('/albums/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    loadAlbums();
    const index = albumsCache.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Album not found' });
    }

    albumsCache.splice(index, 1);
    saveAlbums();

    return res.json({ success: true, message: 'Album deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
