import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  FileCode,
  Video,
  Music,
  Share2,
  Download,
  Trash2,
  RotateCcw,
  Eye,
  MoreVertical,
  Edit3,
  Copy,
  FolderInput,
  Star,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface FileCardProps {
  type: 'file' | 'folder';
  item: FileItem | FolderItem;
  isTrashView?: boolean;
  isSelected?: boolean;
  hasAnySelection?: boolean;
  onSelectToggle?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onOpenFolder?: (folderId: string, folderName: string) => void;
  onPreviewFile?: (file: FileItem) => void;
  onShareItem?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onTrashItem?: (type: 'file' | 'folder', id: string) => void;
  onRestoreItem?: (type: 'file' | 'folder', id: string) => void;
  onDeletePermanently?: (type: 'file' | 'folder', id: string) => void;
  onDownloadFile?: (file: FileItem) => void;
  onRenameItem?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onMoveItem?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onCopyItem?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onToggleStar?: (type: 'file' | 'folder', id: string, currentStarred?: boolean) => void;
  onViewDetails?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  type,
  item,
  isTrashView = false,
  isSelected = false,
  hasAnySelection = false,
  onSelectToggle,
  onOpenFolder,
  onPreviewFile,
  onShareItem,
  onTrashItem,
  onRestoreItem,
  onDeletePermanently,
  onDownloadFile,
  onRenameItem,
  onMoveItem,
  onCopyItem,
  onToggleStar,
  onViewDetails,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isStarred, setIsStarred] = useState(item.isStarred);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsStarred(item.isStarred);
  }, [item.isStarred]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const fileItem = type === 'file' ? (item as FileItem) : null;
  const storeToken = useAuthStore((s) => s.token);
  const token = storeToken || localStorage.getItem('trustBox_token');
  const previewUrl = useMemo(() => fileItem ? `/api/files/${fileItem.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}` : '', [fileItem, token]);

  const formatSize = useCallback((bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = Number(bytesStr);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const ext = useMemo(() => {
    if (!fileItem?.name) return '';
    const parts = fileItem.name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }, [fileItem?.name]);

  const mime = useMemo(() => (fileItem?.mimeType || '').toLowerCase(), [fileItem?.mimeType]);
  const isImage = useMemo(() => mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext), [mime, ext]);
  const isVideo = useMemo(() => mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext), [mime, ext]);
  const isAudio = useMemo(() => mime.startsWith('audio/') || ['mp3', 'wav', 'aac'].includes(ext), [mime, ext]);

  const getFileIcon = useCallback(() => {
    if (type === 'folder') return <Folder size={24} className="text-amber-500" />;
    if (isImage) return <ImageIcon size={24} className="text-blue-400" />;
    if (isVideo) return <Video size={24} className="text-purple-400" />;
    if (isAudio) return <Music size={24} className="text-amber-400" />;
    if (mime.includes('pdf') || ext === 'pdf') return <FileText size={24} className="text-rose-400" />;
    if (mime.includes('word') || ext === 'docx' || ext === 'doc') return <FileText size={24} className="text-blue-400" />;
    if (['js', 'ts', 'py', 'json', 'html', 'css', 'md'].includes(ext)) return <FileCode size={24} className="text-emerald-400" />;
    return <FileText size={24} className="text-zinc-400" />;
  }, [type, isImage, isVideo, isAudio, mime, ext]);

  return (
    <div
      className={`group relative flex flex-col bg-white dark:bg-zinc-900/70 hover:bg-slate-50 dark:hover:bg-zinc-900 border rounded-2xl overflow-visible transition-all duration-200 cursor-pointer select-none shadow-xs hover:shadow-lg ${isSelected
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/40'
          : 'border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
        }`}
      style={{ zIndex: showMenu ? 9999 : 1 }}
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && onSelectToggle) {
          e.stopPropagation();
          onSelectToggle(item, type);
          return;
        }
        if (type === 'folder' && onOpenFolder) onOpenFolder(item.id, item.name);
        if (type === 'file' && onPreviewFile && fileItem) onPreviewFile(fileItem);
      }}
    >

      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-auto">
        {onSelectToggle ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectToggle(item, type); }}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-white/80 dark:bg-zinc-950/60 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 shadow-xs'
              } ${hasAnySelection ? 'opacity-100' : ''}`}
          >
            {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        ) : <div />}

        <div className="flex items-center gap-1.5">
          {!isTrashView && type === 'file' && onToggleStar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsStarred(!isStarred);
                onToggleStar('file', item.id, isStarred);
              }}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${isStarred
                  ? 'bg-white/90 dark:bg-zinc-950/80 text-amber-500 opacity-100 shadow-xs'
                  : 'bg-white/80 dark:bg-zinc-950/60 text-slate-700 dark:text-zinc-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 shadow-xs'
                }`}
            >
              <Star size={13} className={isStarred ? 'fill-amber-400' : ''} />
            </button>
          )}

          <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-950 transition-all opacity-0 group-hover:opacity-100 shadow-xs"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-[99999] flex flex-col gap-0.5 text-left text-xs">
                {!isTrashView ? (
                  <>
                    {onViewDetails && <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); onViewDetails(item, type); }}><Info size={13} className="text-blue-500" /> Details</button>}
                    {type === 'file' && onPreviewFile && <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); onPreviewFile(fileItem!); }}><Eye size={13} /> Preview</button>}
                    {type === 'file' && onDownloadFile && <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); onDownloadFile(fileItem!); }}><Download size={13} /> Download</button>}
                    {onToggleStar && type === 'file' && !fileItem?.isSharedWithMe && (
                      <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); setIsStarred(!isStarred); onToggleStar('file', item.id, isStarred); }}>
                        <Star size={13} className={isStarred ? 'fill-amber-400 text-amber-500' : ''} /> {isStarred ? 'Remove Star' : 'Add Star'}
                      </button>
                    )}
                    {onRenameItem && <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); onRenameItem(item, type); }}><Edit3 size={13} /> Rename</button>}
                    {onShareItem && <button className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => { setShowMenu(false); onShareItem(item, type); }}><Share2 size={13} className="text-blue-500" /> Share</button>}
                    <div className="h-px bg-slate-200 dark:bg-zinc-800 my-1" />
                    {onTrashItem && <button className="flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium" onClick={() => { setShowMenu(false); onTrashItem(type, item.id); }}><Trash2 size={13} /> Trash</button>}
                  </>
                ) : (
                  <>
                    {onRestoreItem && <button className="flex items-center gap-2 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl font-medium" onClick={() => { setShowMenu(false); onRestoreItem(type, item.id); }}><RotateCcw size={13} /> Restore</button>}
                    {onDeletePermanently && <button className="flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium" onClick={() => { setShowMenu(false); onDeletePermanently(type, item.id); }}><Trash2 size={13} /> Delete Forever</button>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-32 w-full bg-slate-50 dark:bg-zinc-950/40 flex items-center justify-center relative overflow-hidden rounded-t-2xl border-b border-slate-100 dark:border-zinc-800/50">
        {type === 'folder' ? (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
            <Folder size={26} className="text-amber-500 fill-amber-500/20" />
          </div>
        ) : isImage ? (
          <img src={previewUrl} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
            {getFileIcon()}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col justify-between">
        <h4 className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={item.name}>
          {item.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 mt-1 font-mono">
          <span>{type === 'folder' ? 'Folder' : formatSize(fileItem?.size)}</span>
          {fileItem?.isSharedWithMe && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-sans font-semibold">Shared</span>}
        </div>
      </div>
    </div>
  );
};
