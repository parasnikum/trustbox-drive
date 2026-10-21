import { create } from 'zustand';
import { PhotoItem, PhotoAlbum, TimelineGroup } from '../types';
import { apiClient } from '../services/apiClient';
import { useWorkspaceStore } from './workspaceStore';

interface PhotoStats {
  totalCount: number;
  photosCount: number;
  videosCount: number;
  favoritesCount: number;
}

interface PhotoState {
  photos: PhotoItem[];
  timeline: TimelineGroup[];
  albums: PhotoAlbum[];
  activeAlbum: PhotoAlbum | null;
  activeFilter: 'all' | 'photos' | 'videos' | 'favorites';
  searchQuery: string;
  selectedPhotoIds: Set<string>;
  isLoading: boolean;
  stats: PhotoStats;
  lightboxItem: PhotoItem | null;
  gridDensity: 'comfortable' | 'compact';

  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalCount: number;

  setGridDensity: (density: 'comfortable' | 'compact') => void;
  setActiveFilter: (filter: 'all' | 'photos' | 'videos' | 'favorites') => void;
  setSearchQuery: (query: string) => void;
  fetchPhotos: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchTimeline: () => Promise<void>;
  fetchAlbums: () => Promise<void>;
  fetchAlbumDetails: (albumId: string) => Promise<void>;
  createAlbum: (name: string, description?: string, fileIds?: string[]) => Promise<PhotoAlbum | null>;
  updateAlbum: (albumId: string, name?: string, description?: string, coverFileId?: string) => Promise<void>;
  deleteAlbum: (albumId: string) => Promise<void>;
  addPhotosToAlbum: (albumId: string, fileIds: string[]) => Promise<void>;
  removePhotosFromAlbum: (albumId: string, fileIds: string[]) => Promise<void>;
  toggleStar: (photoId: string, currentStarred: boolean) => Promise<void>;
  toggleSelect: (photoId: string) => void;
  selectBatch: (photoIds: string[], select: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  deleteSelected: () => Promise<void>;
  openLightbox: (photo: PhotoItem) => void;
  closeLightbox: () => void;
  nextLightboxItem: () => void;
  prevLightboxItem: () => void;
}

const PHOTO_CHUNK_SIZE = 30;

const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif', 'avif',
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', '3gp', 'wmv'
]);

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', '3gp', 'wmv']);

function isMediaFile(f: any): boolean {
  if (f.isTrash) return false;
  const mime = (f.mimeType || '').toLowerCase();
  const ext = f.name?.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';
  return mime.startsWith('image/') || mime.startsWith('video/') || MEDIA_EXTENSIONS.has(ext);
}

function fileToPhotoItem(f: any): PhotoItem {
  const ext = f.name?.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';
  const isVideo = (f.mimeType && f.mimeType.startsWith('video/')) || VIDEO_EXTENSIONS.has(ext);
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
    size: f.size ? f.size.toString() : '0',
    isStarred: Boolean(f.isStarred),
    isTrash: Boolean(f.isTrash),
    createdAt: f.createdAt || new Date().toISOString(),
    updatedAt: f.updatedAt || new Date().toISOString(),
    parentId: f.parentId || null,
    ownerId: f.ownerId || '',
    isVideo,
    isImage: !isVideo,
    previewUrl: f.cachedDownloadUrl || `/api/files/${f.id}/download?inline=true`,
    downloadUrl: `/api/files/${f.id}/download`,
  };
}

function buildTimelineGroups(items: PhotoItem[]): TimelineGroup[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groupsMap = new Map<string, PhotoItem[]>();

  for (const item of items) {
    const d = new Date(item.createdAt);
    let label: string;
    if (d.toDateString() === todayStr) {
      label = 'Today';
    } else if (d.toDateString() === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }
    groupsMap.get(label)!.push(item);
  }

  return Array.from(groupsMap.entries()).map(([label, groupItems]) => ({
    label,
    date: groupItems[0]?.createdAt,
    count: groupItems.length,
    items: groupItems,
  }));
}

const ALBUMS_KEY = 'TrustBox_photo_albums_v1';
function getLocalAlbums(): PhotoAlbum[] {
  try {
    return JSON.parse(localStorage.getItem(ALBUMS_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveLocalAlbums(albums: PhotoAlbum[]) {
  try {
    localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
  } catch {}
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  timeline: [],
  albums: [],
  activeAlbum: null,
  activeFilter: 'all',
  searchQuery: '',
  selectedPhotoIds: new Set(),
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: false,
  totalCount: 0,
  gridDensity: 'comfortable',
  stats: {
    totalCount: 0,
    photosCount: 0,
    videosCount: 0,
    favoritesCount: 0,
  },
  lightboxItem: null,

  setGridDensity: (gridDensity) => set({ gridDensity }),

  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
    get().fetchPhotos(1);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchPhotos(1);
  },

  fetchPhotos: async (page = 1) => {
    set({ isLoading: true, page: 1 });
    try {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      const { activeFilter, searchQuery, activeAlbum } = get();

      const params: any = {
        filter: activeFilter,
        search: searchQuery || undefined,
        workspaceId: activeWs ? activeWs.id : undefined,
        page: 1,
        limit: PHOTO_CHUNK_SIZE,
      };

      if (activeAlbum) {
        params.albumId = activeAlbum.id;
      }

      let photos: PhotoItem[] = [];
      let totalCount = 0;
      let hasMore = false;

      try {
        const res = await apiClient.get('/photos', { params });
        photos = res.data.photos || [];
        totalCount = res.data.totalCount || photos.length;
        hasMore = res.data.hasMore ?? false;
      } catch (err) {

        const fallbackRes = await apiClient.get('/files', {
          params: {
            isRecent: 'true',
            workspaceId: activeWs ? activeWs.id : 'null',
            search: searchQuery || undefined,
            page: 1,
            limit: PHOTO_CHUNK_SIZE,
          },
        });
        const rawFiles = fallbackRes.data.files || [];
        const mediaFiles = rawFiles.filter(isMediaFile).map(fileToPhotoItem);

        photos = mediaFiles.filter((p: PhotoItem) => {
          if (activeFilter === 'photos' && !p.isImage) return false;
          if (activeFilter === 'videos' && !p.isVideo) return false;
          if (activeFilter === 'favorites' && !p.isStarred) return false;
          if (activeAlbum && !activeAlbum.fileIds.includes(p.id)) return false;
          return true;
        });
        totalCount = photos.length;
        hasMore = fallbackRes.data.hasMore ?? false;
      }

      const stats: PhotoStats = {
        totalCount,
        photosCount: photos.filter((p) => p.isImage).length,
        videosCount: photos.filter((p) => p.isVideo).length,
        favoritesCount: photos.filter((p) => p.isStarred).length,
      };

      set({
        photos,
        timeline: buildTimelineGroups(photos),
        stats,
        page: 1,
        hasMore,
        totalCount,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      set({ isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { isLoading, isLoadingMore, hasMore, page, activeFilter, searchQuery, activeAlbum, photos } = get();
    if (isLoading || isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = page + 1;
      const activeWs = useWorkspaceStore.getState().activeWorkspace;

      const params: any = {
        filter: activeFilter,
        search: searchQuery || undefined,
        workspaceId: activeWs ? activeWs.id : undefined,
        page: nextPage,
        limit: PHOTO_CHUNK_SIZE,
      };

      if (activeAlbum) {
        params.albumId = activeAlbum.id;
      }

      const res = await apiClient.get('/photos', { params });
      const nextBatch = res.data.photos || [];

      const existingIds = new Set(photos.map((p) => p.id));
      const newPhotos = nextBatch.filter((p: PhotoItem) => !existingIds.has(p.id));
      const updatedPhotos = [...photos, ...newPhotos];

      set((state) => ({
        photos: updatedPhotos,
        timeline: buildTimelineGroups(updatedPhotos),
        page: nextPage,
        hasMore: res.data.hasMore ?? false,
        totalCount: res.data.totalCount ?? updatedPhotos.length,
        isLoadingMore: false,
      }));
    } catch (err) {
      console.error('Failed to fetch next page of photos:', err);
      set({ isLoadingMore: false });
    }
  },

  fetchTimeline: async () => {
    set({ isLoading: true });
    try {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      let timeline: TimelineGroup[] = [];

      try {
        const res = await apiClient.get('/photos/timeline', {
          params: { workspaceId: activeWs ? activeWs.id : undefined },
        });
        timeline = res.data.timeline || [];
        if (res.data.stats) {
          set({ stats: res.data.stats });
        }
      } catch {

        const fallbackRes = await apiClient.get('/files', {
          params: {
            isRecent: 'true',
            workspaceId: activeWs ? activeWs.id : 'null',
          },
        });
        const rawFiles = fallbackRes.data.files || [];
        const mediaFiles = rawFiles.filter(isMediaFile).map(fileToPhotoItem);
        timeline = buildTimelineGroups(mediaFiles);
      }

      set({
        timeline,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch photo timeline:', err);
      set({ isLoading: false });
    }
  },

  fetchAlbums: async () => {
    try {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      let albums: PhotoAlbum[] = [];
      try {
        const res = await apiClient.get('/photos/albums', {
          params: { workspaceId: activeWs ? activeWs.id : undefined },
        });
        albums = res.data.albums || [];
      } catch {
        albums = getLocalAlbums();
      }
      set({ albums });
    } catch (err) {
      console.error('Failed to fetch albums:', err);
    }
  },

  fetchAlbumDetails: async (albumId: string) => {
    set({ isLoading: true });
    try {
      try {
        const res = await apiClient.get(`/photos/albums/${albumId}`);
        const album = res.data.album;
        set({
          activeAlbum: album,
          photos: album.files || [],
          isLoading: false,
        });
      } catch {

        const local = getLocalAlbums().find((a) => a.id === albumId);
        if (local) {
          const fallbackRes = await apiClient.get('/files', {
            params: { isRecent: 'true' },
          });
          const raw = fallbackRes.data.files || [];
          const media = raw.filter(isMediaFile).map(fileToPhotoItem);
          const albumPhotos = media.filter((m: PhotoItem) => local.fileIds.includes(m.id));
          set({
            activeAlbum: { ...local, files: albumPhotos },
            photos: albumPhotos,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch album details:', err);
      set({ isLoading: false });
    }
  },

  createAlbum: async (name: string, description = '', fileIds = []) => {
    try {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      let newAlbum: PhotoAlbum;
      try {
        const res = await apiClient.post('/photos/albums', {
          name,
          description,
          fileIds,
          workspaceId: activeWs ? activeWs.id : null,
        });
        newAlbum = res.data.album;
      } catch {
        newAlbum = {
          id: `alb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: 'user',
          workspaceId: activeWs ? activeWs.id : null,
          name,
          description,
          coverFileId: fileIds[0] || null,
          coverUrl: null,
          fileIds,
          itemCount: fileIds.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const current = getLocalAlbums();
        saveLocalAlbums([newAlbum, ...current]);
      }
      set((state) => ({
        albums: [newAlbum, ...state.albums],
      }));
      return newAlbum;
    } catch (err) {
      console.error('Failed to create album:', err);
      return null;
    }
  },

  updateAlbum: async (albumId: string, name?: string, description?: string, coverFileId?: string) => {
    try {
      try {
        const res = await apiClient.patch(`/photos/albums/${albumId}`, {
          name,
          description,
          coverFileId,
        });
        const updated = res.data.album;
        set((state) => ({
          albums: state.albums.map((a) => (a.id === albumId ? { ...a, ...updated } : a)),
          activeAlbum: state.activeAlbum?.id === albumId ? { ...state.activeAlbum, ...updated } : state.activeAlbum,
        }));
      } catch {
        const all = getLocalAlbums();
        const target = all.find((a) => a.id === albumId);
        if (target) {
          if (name !== undefined) target.name = name;
          if (description !== undefined) target.description = description;
          if (coverFileId !== undefined) target.coverFileId = coverFileId;
          target.updatedAt = new Date().toISOString();
          saveLocalAlbums(all);
          set((state) => ({
            albums: state.albums.map((a) => (a.id === albumId ? { ...a, ...target } : a)),
            activeAlbum: state.activeAlbum?.id === albumId ? { ...state.activeAlbum, ...target } : state.activeAlbum,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update album:', err);
    }
  },

  deleteAlbum: async (albumId: string) => {
    try {
      try {
        await apiClient.delete(`/photos/albums/${albumId}`);
      } catch {
        const all = getLocalAlbums().filter((a) => a.id !== albumId);
        saveLocalAlbums(all);
      }
      set((state) => ({
        albums: state.albums.filter((a) => a.id !== albumId),
        activeAlbum: state.activeAlbum?.id === albumId ? null : state.activeAlbum,
      }));
    } catch (err) {
      console.error('Failed to delete album:', err);
    }
  },

  addPhotosToAlbum: async (albumId: string, fileIds: string[]) => {
    try {
      try {
        const res = await apiClient.post(`/photos/albums/${albumId}/items`, { fileIds });
        const updatedAlbum = res.data.album;
        set((state) => ({
          albums: state.albums.map((a) => (a.id === albumId ? { ...a, ...updatedAlbum } : a)),
        }));
        if (get().activeAlbum?.id === albumId) {
          get().fetchAlbumDetails(albumId);
        }
      } catch {
        const all = getLocalAlbums();
        const target = all.find((a) => a.id === albumId);
        if (target) {
          const union = Array.from(new Set([...target.fileIds, ...fileIds]));
          target.fileIds = union;
          target.itemCount = union.length;
          target.updatedAt = new Date().toISOString();
          saveLocalAlbums(all);
          set((state) => ({
            albums: state.albums.map((a) => (a.id === albumId ? { ...a, ...target } : a)),
          }));
          if (get().activeAlbum?.id === albumId) {
            get().fetchAlbumDetails(albumId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to add photos to album:', err);
    }
  },

  removePhotosFromAlbum: async (albumId: string, fileIds: string[]) => {
    try {
      try {
        await apiClient.delete(`/photos/albums/${albumId}/items`, { data: { fileIds } });
      } catch {
        const all = getLocalAlbums();
        const target = all.find((a) => a.id === albumId);
        if (target) {
          const removeSet = new Set(fileIds);
          target.fileIds = target.fileIds.filter((id) => !removeSet.has(id));
          target.itemCount = target.fileIds.length;
          target.updatedAt = new Date().toISOString();
          saveLocalAlbums(all);
        }
      }
      set((state) => {
        const removeSet = new Set(fileIds);
        return {
          albums: state.albums.map((a) =>
            a.id === albumId ? { ...a, fileIds: a.fileIds.filter((id) => !removeSet.has(id)) } : a
          ),
          photos: state.activeAlbum?.id === albumId ? state.photos.filter((p) => !removeSet.has(p.id)) : state.photos,
        };
      });
    } catch (err) {
      console.error('Failed to remove photos from album:', err);
    }
  },

  toggleStar: async (photoId: string, currentStarred: boolean) => {
    try {
      await apiClient.patch(`/files/${photoId}/star`, { isStarred: !currentStarred });
      set((state) => ({
        photos: state.photos.map((p) => (p.id === photoId ? { ...p, isStarred: !currentStarred } : p)),
        lightboxItem: state.lightboxItem?.id === photoId ? { ...state.lightboxItem, isStarred: !currentStarred } : state.lightboxItem,
      }));

      set((state) => ({
        timeline: state.timeline.map((group) => ({
          ...group,
          items: group.items.map((p) => (p.id === photoId ? { ...p, isStarred: !currentStarred } : p)),
        })),
      }));
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  },

  toggleSelect: (photoId: string) => {
    set((state) => {
      const next = new Set(state.selectedPhotoIds);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return { selectedPhotoIds: next };
    });
  },

  selectBatch: (photoIds: string[], select: boolean) => {
    set((state) => {
      const next = new Set(state.selectedPhotoIds);
      for (const id of photoIds) {
        if (select) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return { selectedPhotoIds: next };
    });
  },

  selectAll: () => {
    set((state) => {
      const allIds = state.photos.map((p) => p.id);
      return { selectedPhotoIds: new Set(allIds) };
    });
  },

  clearSelection: () => {
    set({ selectedPhotoIds: new Set() });
  },

  deleteSelected: async () => {
    const { selectedPhotoIds } = get();
    if (selectedPhotoIds.size === 0) return;

    try {
      const ids = Array.from(selectedPhotoIds);
      await Promise.all(ids.map((id) => apiClient.post(`/files/${id}/trash`)));
      set((state) => {
        const deletedSet = new Set(ids);
        return {
          photos: state.photos.filter((p) => !deletedSet.has(p.id)),
          selectedPhotoIds: new Set(),
        };
      });
      get().fetchTimeline();
    } catch (err) {
      console.error('Failed to trash selected photos:', err);
    }
  },

  openLightbox: (photo: PhotoItem) => {
    set({ lightboxItem: photo });
  },

  closeLightbox: () => {
    set({ lightboxItem: null });
  },

  nextLightboxItem: () => {
    const { photos, lightboxItem } = get();
    if (!lightboxItem || photos.length === 0) return;
    const currentIndex = photos.findIndex((p) => p.id === lightboxItem.id);
    if (currentIndex < photos.length - 1) {
      set({ lightboxItem: photos[currentIndex + 1] });
    } else {
      set({ lightboxItem: photos[0] });
    }
  },

  prevLightboxItem: () => {
    const { photos, lightboxItem } = get();
    if (!lightboxItem || photos.length === 0) return;
    const currentIndex = photos.findIndex((p) => p.id === lightboxItem.id);
    if (currentIndex > 0) {
      set({ lightboxItem: photos[currentIndex - 1] });
    } else {
      set({ lightboxItem: photos[photos.length - 1] });
    }
  },
}));
