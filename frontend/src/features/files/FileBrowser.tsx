import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FolderPlus, ChevronRight, Home, Upload, Folder, Loader2,
  Trash2, RotateCcw, CheckSquare, Square, Download, FolderInput,
  Users, Share2, Copy, FileText, MoreVertical, Eye, Info, Edit3, Star, Activity,
  Image as ImageIcon, Video, Music, FileCode
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useUploadStore } from '../../stores/uploadStore';
import { FileCard } from './FileCard';
import { FilterBar } from './FilterBar';
import { RenameModal } from './RenameModal';
import { MoveCopyModal } from './MoveCopyModal';
import { FileDetailsModal } from './FileDetailsModal';
import { WorkspaceActivityModal } from '../workspaces/WorkspaceActivityModal';
import { FileItem, FolderItem } from '../../types';
import { scanDroppedItems } from '../../utils/dropScanner';
import { ensureFreshToken } from '../../services/apiClient';

interface FileBrowserProps {
  onPreviewFile: (file: FileItem) => void;
  onShareItem: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

function formatItemDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatItemSize(bytesStr?: string) {
  if (!bytesStr) return '—';
  const bytes = Number(bytesStr);
  if (isNaN(bytes) || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getRowFileIcon(file: FileItem) {
  const mime = (file.mimeType || '').toLowerCase();
  const ext = file.name?.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)) {
    return <ImageIcon size={18} className="text-blue-400" />;
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return <Video size={18} className="text-purple-400" />;
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return <Music size={18} className="text-amber-400" />;
  }
  if (mime.includes('pdf') || ext === 'pdf') {
    return <FileText size={18} className="text-rose-400" />;
  }
  if (mime.includes('word') || ext === 'docx' || ext === 'doc') {
    return <FileText size={18} className="text-blue-400" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'md', 'txt', 'sh', 'sql'].includes(ext)) {
    return <FileCode size={18} className="text-emerald-400" />;
  }
  return <FileText size={18} className="text-zinc-400" />;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onPreviewFile, onShareItem }) => {
  const {
    files,
    folders,
    folderPathHistory,
    isTrashView,
    isStarredView,
    isRecentView,
    isSharedView,
    sharedSubTab,
    sharedByMeLinks,
    layoutMode,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    fetchNextPage,
    createFolder,
    navigateToFolder,
    trashItem,
    restoreItem,
    deletePermanently,
    emptyTrash,
    bulkDeletePermanently,
    bulkRestore,
    bulkTrash,
    bulkMove,
    renameItem,
    moveItem,
    copyItem,
    toggleStarItem,
    setSharedSubTab,
    revokeShareLink,
  } = useFileStore();

  const { uploadFiles } = useUploadStore();
  const [isNewFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; isFolder: boolean }>>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [detailsTarget, setDetailsTarget] = useState<{ type: 'file' | 'folder'; item: FileItem | FolderItem } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ type: 'file' | 'folder'; item: FileItem | FolderItem } | null>(null);
  const [moveCopyAction, setMoveCopyAction] = useState<{ mode: 'move' | 'copy'; type: 'file' | 'folder'; item: FileItem | FolderItem } | null>(null);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, fetchNextPage]);

  useEffect(() => {
    setSelectedItems([]);
    setActiveMenuId(null);
  }, [isTrashView, isStarredView, isRecentView, isSharedView, folderPathHistory]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeMenuId) setActiveMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeMenuId]);

  const handleSelectToggle = useCallback((item: FileItem | FolderItem, type: 'file' | 'folder') => {
    const isFolder = type === 'folder';
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id && i.isFolder === isFolder);
      if (exists) {
        return prev.filter((i) => !(i.id === item.id && i.isFolder === isFolder));
      }
      return [...prev, { id: item.id, isFolder }];
    });
  }, []);

  const allTotalCount = useMemo(() => folders.length + files.length, [folders.length, files.length]);
  const isAllSelected = useMemo(() => allTotalCount > 0 && selectedItems.length === allTotalCount, [allTotalCount, selectedItems.length]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      const allFolders = folders.map((f) => ({ id: f.id, isFolder: true }));
      const allFiles = files.map((f) => ({ id: f.id, isFolder: false }));
      setSelectedItems([...allFolders, ...allFiles]);
    }
  }, [isAllSelected, folders, files]);

  const handleEmptyTrash = async () => {
    if (window.confirm('Permanently delete ALL items in Trash? This action cannot be undone.')) {
      await emptyTrash();
      setSelectedItems([]);
    }
  };

  const handleBulkDeleteForever = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Permanently delete ${selectedItems.length} selected item(s)?`)) {
      await bulkDeletePermanently(selectedItems);
      setSelectedItems([]);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    await bulkRestore(selectedItems);
    setSelectedItems([]);
  };

  const handleBatchTrash = async () => {
    if (selectedItems.length === 0) return;
    await bulkTrash(selectedItems);
    setSelectedItems([]);
  };

  const handleBatchDownload = async () => {
    const selectedFileIds = selectedItems.filter((i) => !i.isFolder).map((i) => i.id);
    if (selectedFileIds.length === 0) return;
    const token = (await ensureFreshToken()) || localStorage.getItem('trustBox_token');
    selectedFileIds.forEach((id, idx) => {
      setTimeout(() => {
        const url = `/api/files/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        window.open(url, '_blank');
      }, idx * 200);
    });
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setNewFolderModalOpen(false);
  };

  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const droppedFiles = await scanDroppedItems(e.dataTransfer);
    if (droppedFiles.length > 0) uploadFiles(droppedFiles);
  };

  const handleDownloadFile = useCallback(async (file: FileItem) => {
    const token = (await ensureFreshToken()) || localStorage.getItem('trustBox_token');
    const url = `/api/files/${file.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  }, []);

  const handleRenameItem = useCallback((item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setRenameTarget({ item, type });
  }, []);

  const handleMoveItem = useCallback((item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setMoveCopyAction({ mode: 'move', type, item });
  }, []);

  const handleCopyItem = useCallback((item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setMoveCopyAction({ mode: 'copy', type, item });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewFolderModalOpen(false);
        setDetailsTarget(null);
        setRenameTarget(null);
        setMoveCopyAction(null);
        setIsBulkMoveModalOpen(false);
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col h-full p-6 lg:p-8 relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-y-auto font-sans selection:bg-blue-600 selection:text-white transition-colors"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigateToFolder(null)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home size={16} />
            <span>My Files</span>
          </button>

          {folderPathHistory.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} className="text-slate-400 dark:text-zinc-600" />
              <button
                onClick={() => navigateToFolder(folder.id, folder.name)}
                className={`transition-colors cursor-pointer truncate max-w-[150px] ${index === folderPathHistory.length - 1
                  ? 'text-slate-900 dark:text-zinc-100 font-bold'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-500'
                  }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {allTotalCount > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isAllSelected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} className="text-slate-400 dark:text-zinc-500" />}
              <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Activity size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span>Activity</span>
          </button>

          {!isTrashView && !isStarredView && !isRecentView && !isSharedView && (
            <button
              onClick={() => setNewFolderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FolderPlus size={15} />
              <span>New Folder</span>
            </button>
          )}
        </div>
      </div>

      {isTrashView && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs font-medium text-amber-200/90 shadow-lg">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Trash2 size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Items in trash are automatically purged after 30 days.</span>
          </div>

          {(folders.length > 0 || files.length > 0) && (
            <button
              onClick={handleEmptyTrash}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Empty Trash
            </button>
          )}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="bg-zinc-900/95 border border-zinc-800/80 backdrop-blur-xl text-white rounded-2xl px-4 py-3 mb-6 flex items-center justify-between text-xs shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="font-bold text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-2">
            {isTrashView ? (
              <>
                <button onClick={handleBulkRestore} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                  <RotateCcw size={13} /> Restore
                </button>
                <button onClick={handleBulkDeleteForever} className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                  <Trash2 size={13} /> Delete Forever
                </button>
              </>
            ) : (
              <>
                {selectedItems.some((i) => !i.isFolder) && (
                  <button onClick={handleBatchDownload} className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-medium transition-all flex items-center gap-1.5 cursor-pointer">
                    <Download size={13} className="text-emerald-400" /> Download
                  </button>
                )}
                <button onClick={() => setIsBulkMoveModalOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-medium transition-all flex items-center gap-1.5 cursor-pointer">
                  <FolderInput size={13} className="text-blue-400" /> Move
                </button>
                <button onClick={handleBatchTrash} className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                  <Trash2 size={13} /> Trash
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isSharedView && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSharedSubTab('shared-with-me')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${sharedSubTab === 'shared-with-me' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
          >
            <Users size={14} /> Shared with Me
          </button>
          <button
            onClick={() => setSharedSubTab('shared-by-me')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${sharedSubTab === 'shared-by-me' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
          >
            <Share2 size={14} /> Shared by Me
            {sharedByMeLinks.length > 0 && <span className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{sharedByMeLinks.length}</span>}
          </button>
        </div>
      )}

      {!isTrashView && (!isSharedView || sharedSubTab === 'shared-with-me') && <FilterBar />}

      {isDragging && (
        <div className="absolute inset-4 z-50 pointer-events-none bg-zinc-950/90 border-2 border-dashed border-blue-500 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-blue-400 shadow-2xl">
          <Upload size={48} className="animate-bounce mb-3" />
          <h3 className="text-lg font-bold text-zinc-100">Drop files to instantly upload</h3>
          <p className="text-xs text-zinc-400 mt-1">High-speed secure storage bucket</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mt-2 pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium">Syncing directory...</span>
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/30 rounded-3xl">
            <Folder size={52} strokeWidth={1} className="mb-3 text-slate-300 dark:text-zinc-600 opacity-60" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Folder is empty</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Drag and drop files here or click New Folder</p>
          </div>
        ) : layoutMode === 'list' ? (

          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800/90 bg-slate-100/70 dark:bg-zinc-950/60 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                    <th className="w-10 px-4 py-3.5 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                      >
                        {isAllSelected ? (
                          <CheckSquare size={15} className="text-blue-500" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Owner</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Last Modified</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Size</th>
                    <th className="w-24 px-4 py-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs text-slate-700 dark:text-zinc-300">

                  {folders.map((folder) => {
                    const isSelected = selectedItems.some((i) => i.id === folder.id && i.isFolder);
                    const isMenuOpen = activeMenuId === `folder_${folder.id}`;

                    return (
                      <tr
                        key={`folder_${folder.id}`}
                        onClick={() => navigateToFolder(folder.id, folder.name)}
                        className={`group cursor-pointer transition-colors ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-200 border-l-2 border-l-blue-500'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          }`}
                      >
                        <td
                          className="px-4 py-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToggle(folder, 'folder');
                          }}
                        >
                          <button className="text-zinc-500 hover:text-blue-400 cursor-pointer">
                            {isSelected ? (
                              <CheckSquare size={15} className="text-blue-400" />
                            ) : (
                              <Square size={15} className="text-zinc-600 group-hover:text-zinc-400" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <Folder size={18} className="text-amber-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-xs md:max-w-md">
                              {folder.name}
                            </span>
                            {folder.isStarred && (
                              <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-zinc-400">
                          {folder.ownerName || folder.ownerEmail || 'You'}
                        </td>

                        <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-zinc-400">
                          {formatItemDate(folder.updatedAt)}
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell text-slate-400 dark:text-zinc-500">
                          Folder
                        </td>

                        <td className="px-4 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleStarItem('folder', folder.id, folder.isStarred)}
                              className={`p-1.5 rounded-lg transition-colors ${folder.isStarred
                                ? 'text-amber-500'
                                : 'text-slate-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100'
                                }`}
                              title={folder.isStarred ? 'Remove star' : 'Star folder'}
                            >
                              <Star size={14} className={folder.isStarred ? 'fill-amber-400' : ''} />
                            </button>

                            <button
                              onClick={() => onShareItem(folder, 'folder')}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Share folder"
                            >
                              <Share2 size={14} />
                            </button>

                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveMenuId(isMenuOpen ? null : `folder_${folder.id}`)}
                                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 py-1.5 shadow-xl z-50 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => { setActiveMenuId(null); navigateToFolder(folder.id, folder.name); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Folder size={14} className="text-amber-500" />
                                    <span>Open Folder</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); onShareItem(folder, 'folder'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Share2 size={14} className="text-blue-500" />
                                    <span>Share</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); toggleStarItem('folder', folder.id, folder.isStarred); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Star size={14} className={folder.isStarred ? 'text-amber-500 fill-amber-400' : 'text-slate-400 dark:text-zinc-400'} />
                                    <span>{folder.isStarred ? 'Remove Star' : 'Add Star'}</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleRenameItem(folder, 'folder'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Edit3 size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleMoveItem(folder, 'folder'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <FolderInput size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Move</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleCopyItem(folder, 'folder'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Copy size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Copy</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); setDetailsTarget({ type: 'folder', item: folder }); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Info size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Details</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      isTrashView ? deletePermanently('folder', folder.id) : trashItem('folder', folder.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                    <span>{isTrashView ? 'Delete Forever' : 'Move to Trash'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {files.map((file) => {
                    const isSelected = selectedItems.some((i) => i.id === file.id && !i.isFolder);
                    const isMenuOpen = activeMenuId === `file_${file.id}`;

                    return (
                      <tr
                        key={`file_${file.id}`}
                        onClick={() => onPreviewFile(file)}
                        className={`group cursor-pointer transition-colors ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-l-2 border-l-blue-500'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          }`}
                      >
                        <td
                          className="px-4 py-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToggle(file, 'file');
                          }}
                        >
                          <button className="text-slate-400 dark:text-zinc-500 hover:text-blue-500 cursor-pointer">
                            {isSelected ? (
                              <CheckSquare size={15} className="text-blue-500" />
                            ) : (
                              <Square size={15} className="text-slate-400 dark:text-zinc-600 group-hover:text-slate-600 dark:group-hover:text-zinc-400" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{getRowFileIcon(file)}</span>
                            <span className="font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-xs md:max-w-md">
                              {file.name}
                            </span>
                            {file.isStarred && (
                              <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-zinc-400">
                          {file.ownerName || file.ownerEmail || 'You'}
                        </td>

                        <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-zinc-400">
                          {formatItemDate(file.updatedAt)}
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-zinc-400 font-mono">
                          {formatItemSize(file.size)}
                        </td>

                        <td className="px-4 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleStarItem('file', file.id, file.isStarred)}
                              className={`p-1.5 rounded-lg transition-colors ${file.isStarred
                                ? 'text-amber-500'
                                : 'text-slate-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100'
                                }`}
                              title={file.isStarred ? 'Remove star' : 'Star file'}
                            >
                              <Star size={14} className={file.isStarred ? 'fill-amber-400' : ''} />
                            </button>

                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Download file"
                            >
                              <Download size={14} />
                            </button>

                            <button
                              onClick={() => onShareItem(file, 'file')}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Share file"
                            >
                              <Share2 size={14} />
                            </button>

                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveMenuId(isMenuOpen ? null : `file_${file.id}`)}
                                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 py-1.5 shadow-xl z-50 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => { setActiveMenuId(null); onPreviewFile(file); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Eye size={14} className="text-blue-500" />
                                    <span>Preview</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleDownloadFile(file); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Download size={14} className="text-emerald-500" />
                                    <span>Download</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); onShareItem(file, 'file'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Share2 size={14} className="text-blue-500" />
                                    <span>Share</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); toggleStarItem('file', file.id, file.isStarred); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Star size={14} className={file.isStarred ? 'text-amber-500 fill-amber-400' : 'text-slate-400 dark:text-zinc-400'} />
                                    <span>{file.isStarred ? 'Remove Star' : 'Add Star'}</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleRenameItem(file, 'file'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Edit3 size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleMoveItem(file, 'file'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <FolderInput size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Move</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); handleCopyItem(file, 'file'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Copy size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Copy</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveMenuId(null); setDetailsTarget({ type: 'file', item: file }); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
                                  >
                                    <Info size={14} className="text-slate-400 dark:text-zinc-400" />
                                    <span>Details</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      isTrashView ? deletePermanently('file', file.id) : trashItem('file', file.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                    <span>{isTrashView ? 'Delete Forever' : 'Move to Trash'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (

          <div className="flex flex-col gap-8">
            {folders.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1">
                  Folders ({folders.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <FileCard
                      key={folder.id}
                      type="folder"
                      item={folder}
                      isTrashView={isTrashView}
                      isSelected={selectedItems.some((i) => i.id === folder.id && i.isFolder)}
                      hasAnySelection={selectedItems.length > 0}
                      onSelectToggle={handleSelectToggle}
                      onOpenFolder={(id, name) => navigateToFolder(id, name)}
                      onShareItem={onShareItem}
                      onTrashItem={trashItem}
                      onRestoreItem={restoreItem}
                      onDeletePermanently={deletePermanently}
                      onRenameItem={handleRenameItem}
                      onMoveItem={handleMoveItem}
                      onCopyItem={handleCopyItem}
                      onToggleStar={toggleStarItem}
                      onViewDetails={(target, targetType) => setDetailsTarget({ type: targetType, item: target })}
                    />
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1">
                  Files ({files.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      type="file"
                      item={file}
                      isTrashView={isTrashView}
                      isSelected={selectedItems.some((i) => i.id === file.id && !i.isFolder)}
                      hasAnySelection={selectedItems.length > 0}
                      onSelectToggle={handleSelectToggle}
                      onPreviewFile={onPreviewFile}
                      onShareItem={onShareItem}
                      onTrashItem={trashItem}
                      onRestoreItem={restoreItem}
                      onDeletePermanently={deletePermanently}
                      onDownloadFile={handleDownloadFile}
                      onRenameItem={handleRenameItem}
                      onMoveItem={handleMoveItem}
                      onCopyItem={handleCopyItem}
                      onToggleStar={toggleStarItem}
                      onViewDetails={(target, targetType) => setDetailsTarget({ type: targetType, item: target })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={observerRef} className="w-full py-6 flex flex-col items-center justify-center min-h-[50px]">
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-zinc-300 animate-fade-in">
              <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
              <span>Loading more files...</span>
            </div>
          )}
          {!hasMore && files.length > 20 && (
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-600">
              All {totalCount || files.length} items loaded
            </p>
          )}
        </div>
      </div>

      <FileDetailsModal item={detailsTarget} onClose={() => setDetailsTarget(null)} onDownload={handleDownloadFile} onShare={onShareItem} currentFolderPath="/My files" />

      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-zinc-950/80 backdrop-blur-xs" onClick={() => setNewFolderModalOpen(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none mb-5"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer" onClick={() => setNewFolderModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RenameModal item={renameTarget} onClose={() => setRenameTarget(null)} onRename={renameItem} />
      <MoveCopyModal action={moveCopyAction} onClose={() => setMoveCopyAction(null)} onConfirm={async (mode, type, id, target) => { mode === 'move' ? await moveItem(type, id, target) : await copyItem(type, id, target); }} />
      <WorkspaceActivityModal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} />
    </div>
  );
};
