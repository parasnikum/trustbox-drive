import { create } from 'zustand';
import { FileItem, FolderItem, FileEventPayload } from '../types';
import { apiClient } from '../services/apiClient';
import { useWorkspaceStore } from './workspaceStore';

interface FileState {
  files: FileItem[];
  folders: FolderItem[];
  currentFolderId: string | null;
  folderPathHistory: Array<{ id: string | null; name: string }>;
  isTrashView: boolean;
  isStarredView: boolean;
  isRecentView: boolean;
  isSharedView: boolean;
  sharedSubTab: 'shared-with-me' | 'shared-by-me';
  sharedByMeLinks: any[];
  layoutMode: 'grid' | 'list';
  typeFilter: string;
  dateFilter: string;
  searchQuery: string;
  isLoading: boolean;
  selectedItem: { type: 'file' | 'folder'; item: FileItem | FolderItem } | null;
  selectedFileIds: Set<string>;
  selectedFolderIds: Set<string>;

  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalCount: number;

  fetchItems: (folderId?: string | null, isTrash?: boolean, search?: string, page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameItem: (type: 'file' | 'folder', id: string, newName: string) => Promise<void>;
  moveItem: (type: 'file' | 'folder', id: string, targetParentId: string | null) => Promise<void>;
  copyItem: (type: 'file' | 'folder', id: string, targetParentId: string | null) => Promise<void>;
  toggleStarItem: (type: 'file' | 'folder', id: string, currentStarred?: boolean) => Promise<void>;
  trashItem: (type: 'file' | 'folder', id: string) => Promise<void>;
  restoreItem: (type: 'file' | 'folder', id: string) => Promise<void>;
  deletePermanently: (type: 'file' | 'folder', id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  bulkDeletePermanently: (items: Array<{ id: string; isFolder: boolean }>) => Promise<void>;
  bulkRestore: (items: Array<{ id: string; isFolder: boolean }>) => Promise<void>;
  bulkTrash: (items: Array<{ id: string; isFolder: boolean }>) => Promise<void>;
  bulkMove: (items: Array<{ id: string; isFolder: boolean }>, targetParentId: string | null) => Promise<void>;
  batchDownloadSelected: () => Promise<void>;
  toggleFileSelection: (id: string) => void;
  toggleFolderSelection: (id: string) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  revokeShareLink: (shareId: string) => Promise<void>;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
  setLayoutMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setTrashView: (isTrash: boolean) => void;
  setStarredView: (isStarred: boolean) => void;
  setRecentView: (isRecent: boolean) => void;
  setSharedView: (isShared: boolean) => void;
  setSharedSubTab: (tab: 'shared-with-me' | 'shared-by-me') => void;
  setTypeFilter: (typeFilter: string) => void;
  setDateFilter: (dateFilter: string) => void;
  setSelectedItem: (selected: { type: 'file' | 'folder'; item: FileItem | FolderItem } | null) => void;
  handleRealTimeEvent: (event: FileEventPayload) => void;
}

const CHUNK_SIZE = 30;

function matchesType(file: any, typeFilter: string): boolean {
  if (!typeFilter || typeFilter === 'all') return true;
  const mime = (file.mimeType || '').toLowerCase();
  const ext = file.name?.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';

  if (typeFilter === 'image') {
    return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif'].includes(ext);
  }
  if (typeFilter === 'video') {
    return mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext);
  }
  if (typeFilter === 'audio') {
    return mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
  }
  if (typeFilter === 'pdf') {
    return mime.includes('pdf') || ext === 'pdf';
  }
  if (typeFilter === 'document') {
    return (
      mime.includes('document') || mime.includes('word') || mime.includes('sheet') ||
      mime.includes('excel') || mime.includes('presentation') || mime.startsWith('text/') ||
      mime.includes('csv') || ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(ext)
    );
  }
  if (typeFilter === 'code') {
    return (
      mime.includes('javascript') || mime.includes('json') || mime.includes('xml') ||
      mime.includes('html') || mime.startsWith('text/') ||
      ['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'md', 'txt', 'sh', 'sql'].includes(ext)
    );
  }
  return true;
}

function matchesDate(file: any, dateFilter: string): boolean {
  if (!dateFilter || dateFilter === 'all') return true;
  const fileDate = new Date(file.updatedAt || file.createdAt).getTime();
  const now = Date.now();
  if (dateFilter === '24h') return now - fileDate <= 24 * 60 * 60 * 1000;
  if (dateFilter === '7d') return now - fileDate <= 7 * 24 * 60 * 60 * 1000;
  if (dateFilter === '30d') return now - fileDate <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  folders: [],
  currentFolderId: null,
  folderPathHistory: [{ id: null, name: 'My Drive' }],
  isTrashView: false,
  isStarredView: false,
  isRecentView: false,
  isSharedView: false,
  sharedSubTab: 'shared-with-me',
  sharedByMeLinks: [],
  layoutMode: 'grid',
  typeFilter: 'all',
  dateFilter: 'all',
  searchQuery: '',
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: false,
  totalCount: 0,
  selectedItem: null,
  selectedFileIds: new Set<string>(),
  selectedFolderIds: new Set<string>(),

  setLayoutMode: (mode) => set({ layoutMode: mode }),

  fetchItems: async (folderId = get().currentFolderId, isTrash = get().isTrashView, search = get().searchQuery, page = 1) => {
    set({ isLoading: true, page: 1 });
    try {
      if (get().isSharedView) {
        const [sharedWithMeRes, sharedByMeRes] = await Promise.all([
          apiClient.get('/shares/shared-with-me'),
          apiClient.get('/shares/shared-by-me'),
        ]);
        set({
          files: sharedWithMeRes.data.files || [],
          folders: sharedWithMeRes.data.folders || [],
          sharedByMeLinks: sharedByMeRes.data.shares || [],
          isLoading: false,
          hasMore: false,
          totalCount: (sharedWithMeRes.data.files || []).length,
        });
        return;
      }

      const folderParam = folderId ? folderId : 'null';
      const isStarred = get().isStarredView;
      const isRecent = get().isRecentView;
      const typeFilter = get().typeFilter;
      const dateFilter = get().dateFilter;
      const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspace?.id || 'null';

      const queryParams = new URLSearchParams({
        parentId: folderParam,
        workspaceId: activeWorkspaceId,
        isTrash: String(isTrash),
        isStarred: String(isStarred),
        isRecent: String(isRecent),
        search: search || '',
        typeFilter: typeFilter || 'all',
        dateFilter: dateFilter || 'all',
        page: '1',
        limit: String(CHUNK_SIZE),
      });

      const [filesRes, foldersRes] = await Promise.all([
        apiClient.get(`/files?${queryParams.toString()}`),
        apiClient.get(`/folders?${queryParams.toString()}`),
      ]);

      let fetchedFiles = filesRes.data.files || [];
      let fetchedFolders = foldersRes.data.folders || [];

      if (typeFilter && typeFilter !== 'all') {
        fetchedFolders = [];
        fetchedFiles = fetchedFiles.filter((f: any) => matchesType(f, typeFilter));
      }

      if (dateFilter && dateFilter !== 'all') {
        fetchedFiles = fetchedFiles.filter((f: any) => matchesDate(f, dateFilter));
      }

      set({
        files: fetchedFiles,
        folders: fetchedFolders,
        page: 1,
        hasMore: filesRes.data.hasMore ?? false,
        totalCount: filesRes.data.totalCount ?? fetchedFiles.length,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error fetching file items:', err);
      set({ isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { isLoading, isLoadingMore, hasMore, isSharedView, page, currentFolderId, isTrashView, searchQuery, typeFilter, dateFilter } = get();
    if (isLoading || isLoadingMore || !hasMore || isSharedView) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = page + 1;
      const folderParam = currentFolderId ? currentFolderId : 'null';
      const isStarred = get().isStarredView;
      const isRecent = get().isRecentView;
      const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspace?.id || 'null';

      const queryParams = new URLSearchParams({
        parentId: folderParam,
        workspaceId: activeWorkspaceId,
        isTrash: String(isTrashView),
        isStarred: String(isStarred),
        isRecent: String(isRecent),
        search: searchQuery || '',
        typeFilter: typeFilter || 'all',
        dateFilter: dateFilter || 'all',
        page: String(nextPage),
        limit: String(CHUNK_SIZE),
      });

      const filesRes = await apiClient.get(`/files?${queryParams.toString()}`);
      let newFiles = filesRes.data.files || [];

      if (typeFilter && typeFilter !== 'all') {
        newFiles = newFiles.filter((f: any) => matchesType(f, typeFilter));
      }
      if (dateFilter && dateFilter !== 'all') {
        newFiles = newFiles.filter((f: any) => matchesDate(f, dateFilter));
      }

      set((state) => {
        const existingIds = new Set(state.files.map((f) => f.id));
        const filteredNewFiles = newFiles.filter((f: any) => !existingIds.has(f.id));
        return {
          files: [...state.files, ...filteredNewFiles],
          page: nextPage,
          hasMore: filesRes.data.hasMore ?? false,
          totalCount: filesRes.data.totalCount ?? (state.files.length + filteredNewFiles.length),
          isLoadingMore: false,
        };
      });
    } catch (err) {
      console.error('Error fetching next page of files:', err);
      set({ isLoadingMore: false });
    }
  },

  createFolder: async (name: string) => {
    try {
      const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspace?.id || null;
      const res = await apiClient.post('/folders', {
        name,
        parentId: get().currentFolderId,
        workspaceId: activeWorkspaceId,
      });
      const newFolder = res.data.folder;
      set((state) => ({ folders: [...state.folders, newFolder] }));
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  },

  renameItem: async (type, id, newName) => {
    try {
      if (type === 'file') {
        const res = await apiClient.patch(`/files/${id}`, { name: newName });
        const updated = res.data.file;
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }));
      } else {
        const res = await apiClient.patch(`/folders/${id}`, { name: newName });
        const updated = res.data.folder;
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? updated : f)),
        }));
      }
    } catch (err) {
      console.error('Error renaming item:', err);
    }
  },

  toggleStarItem: async (type, id, currentStarred = false) => {
    try {
      const targetStarred = !currentStarred;
      if (type === 'file') {
        const res = await apiClient.patch(`/files/${id}`, { isStarred: targetStarred });
        const updated = res.data.file;
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }));
      } else {
        const res = await apiClient.patch(`/folders/${id}`, { isStarred: targetStarred });
        const updated = res.data.folder;
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? updated : f)),
        }));
      }

      if (get().isStarredView) {
        get().fetchItems();
      }
    } catch (err) {
      console.error('Error toggling star on item:', err);
    }
  },

  moveItem: async (type, id, targetParentId) => {
    try {
      if (type === 'file') {
        await apiClient.post(`/files/${id}/move`, { targetParentId });
      } else {
        await apiClient.patch(`/folders/${id}`, { parentId: targetParentId });
      }
      get().fetchItems();
    } catch (err) {
      console.error('Error moving item:', err);
    }
  },

  copyItem: async (type, id, targetParentId) => {
    try {
      if (type === 'file') {
        await apiClient.post(`/files/${id}/copy`, { targetParentId });
        get().fetchItems();
      }
    } catch (err) {
      console.error('Error copying item:', err);
    }
  },

  trashItem: async (type, id) => {
    try {
      if (type === 'file') {
        await apiClient.post(`/files/${id}/trash`);
        set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
      } else {
        await apiClient.post(`/folders/${id}/trash`);
        set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
      }
    } catch (err) {
      console.error('Error trashing item:', err);
    }
  },

  restoreItem: async (type, id) => {
    try {
      if (type === 'file') {
        await apiClient.patch(`/files/${id}`, { isTrash: false });
        set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
      } else {
        await apiClient.patch(`/folders/${id}`, { isTrash: false });
        set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
      }
    } catch (err) {
      console.error('Error restoring item:', err);
    }
  },

  deletePermanently: async (type, id) => {
    try {
      if (type === 'file') {
        await apiClient.delete(`/files/${id}`);
        set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
      } else {
        await apiClient.delete(`/folders/${id}`);
        set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
      }
    } catch (err) {
      console.error('Error permanently deleting item:', err);
    }
  },

  emptyTrash: async () => {
    try {
      await apiClient.post('/files/trash/empty');
      set({ files: [], folders: [] });
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  },

  bulkDeletePermanently: async (items) => {
    try {
      const payloadItems = items.map((i) => ({ id: i.id, isFolder: !!i.isFolder, type: i.isFolder ? 'folder' : 'file' }));
      await apiClient.post('/files/bulk-delete', { items: payloadItems });
      const deletedFileIds = new Set(items.filter((i) => !i.isFolder).map((i) => i.id));
      const deletedFolderIds = new Set(items.filter((i) => i.isFolder).map((i) => i.id));
      set((state) => ({
        files: state.files.filter((f) => !deletedFileIds.has(f.id)),
        folders: state.folders.filter((f) => !deletedFolderIds.has(f.id)),
      }));
    } catch (err) {
      console.error('Error in bulk delete permanently:', err);
    }
  },

  bulkRestore: async (items) => {
    try {
      const payloadItems = items.map((i) => ({ id: i.id, isFolder: !!i.isFolder, type: i.isFolder ? 'folder' : 'file' }));
      await apiClient.post('/files/bulk-restore', { items: payloadItems });
      const restoredFileIds = new Set(items.filter((i) => !i.isFolder).map((i) => i.id));
      const restoredFolderIds = new Set(items.filter((i) => i.isFolder).map((i) => i.id));
      set((state) => ({
        files: state.files.filter((f) => !restoredFileIds.has(f.id)),
        folders: state.folders.filter((f) => !restoredFolderIds.has(f.id)),
      }));
    } catch (err) {
      console.error('Error in bulk restore:', err);
    }
  },

  bulkTrash: async (items) => {
    try {
      const payloadItems = items.map((i) => ({ id: i.id, isFolder: !!i.isFolder, type: i.isFolder ? 'folder' : 'file' }));
      await apiClient.post('/files/bulk-trash', { items: payloadItems });
      const trashedFileIds = new Set(items.filter((i) => !i.isFolder).map((i) => i.id));
      const trashedFolderIds = new Set(items.filter((i) => i.isFolder).map((i) => i.id));
      set((state) => ({
        files: state.files.filter((f) => !trashedFileIds.has(f.id)),
        folders: state.folders.filter((f) => !trashedFolderIds.has(f.id)),
      }));
    } catch (err) {
      console.error('Error in bulk trash:', err);
    }
  },

  bulkMove: async (items, targetParentId) => {
    try {
      const payloadItems = items.map((i) => ({ id: i.id, isFolder: !!i.isFolder, type: i.isFolder ? 'folder' : 'file' }));
      await apiClient.post('/files/bulk-move', { items: payloadItems, targetParentId });
      get().fetchItems();
    } catch (err) {
      console.error('Error in bulk move:', err);
    }
  },

  toggleFileSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedFileIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedFileIds: next };
    });
  },

  toggleFolderSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedFolderIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedFolderIds: next };
    });
  },

  selectAllItems: () => {
    const { files, folders } = get();
    set({
      selectedFileIds: new Set(files.map((f) => f.id)),
      selectedFolderIds: new Set(folders.map((f) => f.id)),
    });
  },

  clearSelection: () => {
    set({
      selectedFileIds: new Set(),
      selectedFolderIds: new Set(),
    });
  },

  batchDownloadSelected: async () => {
    try {
      const { selectedFileIds } = get();
      const fileIds = Array.from(selectedFileIds);
      if (fileIds.length === 0) return;

      const res = await apiClient.post('/files/batch-download', { fileIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TrustBox-Batch-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download batch ZIP:', err);
    }
  },

  revokeShareLink: async (shareId) => {
    try {
      await apiClient.delete(`/shares/${shareId}`);
      set((state) => ({
        sharedByMeLinks: state.sharedByMeLinks.filter((s) => s.id !== shareId),
      }));
    } catch (err) {
      console.error('Error revoking share link:', err);
    }
  },

  navigateToFolder: (folderId, folderName) => {
    const { folderPathHistory } = get();
    let newHistory = [...folderPathHistory];

    if (folderId === null) {
      newHistory = [{ id: null, name: 'My Drive' }];
    } else {
      const existingIdx = newHistory.findIndex((h) => h.id === folderId);
      if (existingIdx !== -1) {
        newHistory = newHistory.slice(0, existingIdx + 1);
      } else if (folderName) {
        newHistory.push({ id: folderId, name: folderName });
      }
    }

    if (folderId) {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      const wsPrefix = activeWs ? `/w/${activeWs.id}` : '';
      const targetPath = `${wsPrefix}/folder/${folderId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }

    set({
      currentFolderId: folderId,
      folderPathHistory: newHistory,
      selectedItem: null,
      isTrashView: false,
      isStarredView: false,
      isRecentView: false,
      isSharedView: false,
    });
    get().fetchItems(folderId);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchItems(get().currentFolderId, get().isTrashView, query);
  },

  setTrashView: (isTrash) => {
    set({
      isTrashView: isTrash,
      isStarredView: false,
      isRecentView: false,
      isSharedView: false,
      folderPathHistory: isTrash ? [{ id: null, name: 'Trash' }] : [{ id: null, name: 'My Drive' }],
      currentFolderId: null,
      selectedItem: null,
    });
    get().fetchItems(null, isTrash);
  },

  setStarredView: (isStarred) => {
    set({
      isStarredView: isStarred,
      isTrashView: false,
      isRecentView: false,
      isSharedView: false,
      folderPathHistory: isStarred ? [{ id: null, name: 'Starred' }] : [{ id: null, name: 'My Drive' }],
      currentFolderId: null,
      selectedItem: null,
    });
    get().fetchItems(null, false);
  },

  setRecentView: (isRecent) => {
    set({
      isRecentView: isRecent,
      isTrashView: false,
      isStarredView: false,
      isSharedView: false,
      folderPathHistory: isRecent ? [{ id: null, name: 'Recent' }] : [{ id: null, name: 'My Drive' }],
      currentFolderId: null,
      selectedItem: null,
    });
    get().fetchItems(null, false);
  },

  setSharedView: (isShared) => {
    set({
      isSharedView: isShared,
      isTrashView: false,
      isStarredView: false,
      isRecentView: false,
      sharedSubTab: 'shared-with-me',
      folderPathHistory: isShared ? [{ id: null, name: 'Shared Files' }] : [{ id: null, name: 'My Drive' }],
      currentFolderId: null,
      selectedItem: null,
    });
    get().fetchItems(null, false);
  },

  setSharedSubTab: (tab) => {
    set({ sharedSubTab: tab });
  },

  setTypeFilter: (typeFilter) => {
    set({ typeFilter });
    get().fetchItems();
  },

  setDateFilter: (dateFilter) => {
    set({ dateFilter });
    get().fetchItems();
  },

  setSelectedItem: (selected) => set({ selectedItem: selected }),

  handleRealTimeEvent: (event: FileEventPayload) => {
    console.log('⚡ [FileStore] Applying real-time sync update:', event.eventType, event.payload);
    get().fetchItems();
  },
}));
