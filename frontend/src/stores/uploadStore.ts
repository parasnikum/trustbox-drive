import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import { useFileStore } from './fileStore';
import { useWorkspaceStore } from './workspaceStore';
import { usePhotoStore } from './photoStore';

export interface UploadItem {
  id: string;
  file: File;
  relativePath?: string;
  targetParentId?: string | null;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  storageProvider?: string;
  error?: string;
}

interface UploadState {
  queue: UploadItem[];
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  uploadFiles: (files: FileList | File[], rootParentId?: string | null) => Promise<any[]>;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],
  isUploadModalOpen: false,

  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  uploadFiles: async (files, rootParentId = useFileStore.getState().currentFolderId) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return [];

    const completedFiles: any[] = [];

    const newItems: UploadItem[] = fileArray.map((file) => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      relativePath: file.webkitRelativePath || file.name,
      targetParentId: rootParentId,
      progress: 0,
      status: 'PENDING',
    }));

    set((state) => ({ queue: [...state.queue, ...newItems], isUploadModalOpen: false }));

    const folderCache = new Map<string, string>();

    const resolveParentFolderId = async (relativePath?: string): Promise<string | null> => {
      if (!relativePath) return rootParentId;
      const parts = relativePath.split('/').filter(Boolean);
      if (parts.length <= 1) return rootParentId;

      const dirParts = parts.slice(0, -1);
      let currentParentId = rootParentId;
      let currentPathKey = rootParentId || 'root';

      for (const dirName of dirParts) {
        currentPathKey = `${currentPathKey}/${dirName}`;
        if (folderCache.has(currentPathKey)) {
          currentParentId = folderCache.get(currentPathKey)!;
        } else {
          try {
            const res = await apiClient.post('/folders', {
              name: dirName,
              parentId: currentParentId,
            });
            const createdFolderId = res.data.folder.id;
            folderCache.set(currentPathKey, createdFolderId);
            currentParentId = createdFolderId;
          } catch (err: any) {
            console.error(`Error resolving folder ${dirName}:`, err);
          }
        }
      }

      return currentParentId;
    };

    for (const item of newItems) {
      try {
        set((state) => ({
          queue: state.queue.map((q) => (q.id === item.id ? { ...q, status: 'UPLOADING', progress: 10 } : q)),
        }));

        const targetParentId = await resolveParentFolderId(item.relativePath);

        const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspace?.id || null;

        const sessionRes = await apiClient.post('/uploads', {
          fileName: item.file.name,
          mimeType: item.file.type || 'application/octet-stream',
          size: item.file.size,
          parentId: targetParentId,
          workspaceId: activeWorkspaceId,
        });

        const { uploadSessionId, uploadUrl, providerName } = sessionRes.data;

        set((state) => ({
          queue: state.queue.map((q) => (q.id === item.id ? { ...q, storageProvider: providerName, progress: 30 } : q)),
        }));

        if (!uploadUrl) {
          throw new Error('Storage provider did not generate a pre-signed URL for direct upload.');
        }

        try {
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': item.file.type || 'application/octet-stream' },
            body: item.file,
          });

          if (!uploadRes.ok) {
            throw new Error(`Direct storage upload failed with status ${uploadRes.status}. Check bucket CORS configuration.`);
          }
        } catch (directErr: any) {
          throw new Error(`Direct upload to object storage failed (${directErr.message || 'CORS or network error'}). VPS proxy is disabled.`);
        }

        const completeRes = await apiClient.post(`/uploads/${uploadSessionId}/complete`, {});
        if (completeRes.data?.file) {
          completedFiles.push(completeRes.data.file);
        }

        set((state) => ({
          queue: state.queue.map((q) => (q.id === item.id ? { ...q, status: 'COMPLETED', progress: 100 } : q)),
        }));

        useFileStore.getState().fetchItems();
        try {
          usePhotoStore.getState().fetchPhotos();
          usePhotoStore.getState().fetchTimeline();
        } catch (photoErr) {
          console.warn('PhotoStore refresh non-fatal error:', photoErr);
        }
      } catch (err: any) {
        console.error('Upload failed:', err);
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === item.id ? { ...q, status: 'ERROR', error: err.message || 'Upload failed' } : q
          ),
        }));
      }
    }

    return completedFiles;
  },

  cancelUpload: (id) => {
    set((state) => ({ queue: state.queue.filter((q) => q.id !== id) }));
  },

  clearCompleted: () => {
    set((state) => ({ queue: state.queue.filter((q) => q.status !== 'COMPLETED') }));
  },
}));
