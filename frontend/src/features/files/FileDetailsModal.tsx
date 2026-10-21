import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Folder,
  HardDrive,
  Calendar,
  Clock,
  User,
  MapPin,
  FileCode,
  ShieldCheck,
  Share2,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { FileItem, FolderItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../services/apiClient';

interface FileVersionItem {
  id: string;
  fileId: string;
  versionNumber: number;
  size: string;
  checksum: string;
  createdAt: string;
}

interface FileDetailsModalProps {
  item: { type: 'file' | 'folder'; item: FileItem | FolderItem } | null;
  onClose: () => void;
  onDownload?: (file: FileItem) => void;
  onShare?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  currentFolderPath?: string;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  item,
  onClose,
  onDownload,
  onShare,
  currentFolderPath = '/My files',
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [versions, setVersions] = useState<FileVersionItem[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isFile = item?.type === 'file';
  const file = isFile ? (item.item as FileItem) : null;
  const folder = !isFile ? (item?.item as FolderItem) : null;

  useEffect(() => {
    if (activeTab === 'history' && file) {
      const fetchVersions = async () => {
        setVersionsLoading(true);
        try {
          const res = await apiClient.get<{ versions: FileVersionItem[] }>(`/files/${file.id}/versions`);
          setVersions(res.data.versions || []);
        } catch (err) {
          console.error('Failed to fetch file versions:', err);
        } finally {
          setVersionsLoading(false);
        }
      };
      fetchVersions();
    }
  }, [activeTab, file]);

  if (!item) return null;

  const handleRestoreVersion = async (versionId: string) => {
    if (!file) return;
    try {
      setRestoringVersionId(versionId);
      await apiClient.post(`/files/${file.id}/versions/${versionId}/restore`);
      setSuccessMsg('Restored file to selected version!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to restore file version:', err);
    } finally {
      setRestoringVersionId(null);
    }
  };

  const rawBytes = Number(file?.size || 0);

  const formatOriginalSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatEncryptedSize = (bytes: number): string => {
    if (bytes === 0) return '0 bytes';
    const encryptedBytes = bytes < 1024 ? bytes + 1114 : Math.round(bytes * 1.015 + 1114);
    if (encryptedBytes < 1024) return `${encryptedBytes} bytes`;
    if (encryptedBytes < 1024 * 1024) return `${(encryptedBytes / 1024).toFixed(2)} KB`;
    return `${(encryptedBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFriendlyType = (filename: string, mimeType?: string, isFolder?: boolean): string => {
    if (isFolder) return 'Folder';
    const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : '';
    const mime = (mimeType || '').toLowerCase();

    if (ext === 'webp' || mime.includes('webp')) return 'WEBP image';
    if (ext === 'png' || mime.includes('png')) return 'PNG image';
    if (ext === 'jpg' || ext === 'jpeg' || mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG image';
    if (ext === 'gif' || mime.includes('gif')) return 'GIF image';
    if (ext === 'svg' || mime.includes('svg')) return 'SVG image';
    if (ext === 'pdf' || mime.includes('pdf')) return 'PDF document';
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'Word document';
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('sheet')) return 'Spreadsheet';
    if (['zip', 'rar', '7z'].includes(ext)) return 'Compressed archive';
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'Video file';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac'].includes(ext)) return 'Audio file';

    return ext ? `${ext.toUpperCase()} file` : 'Document';
  };

  const createdDate = new Date(item.item.createdAt || Date.now());
  const uploadedTimeStr = createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const modifiedDate = new Date(item.item.updatedAt || item.item.createdAt || Date.now());
  const modifiedStr = `${modifiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${modifiedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  const locationPath = (item.item as any).parentPath || currentFolderPath || (item.item.parentId ? `/My files/${(item.item as any).parentName || 'Folder'}` : '/My files');
  const createdByEmail = (item.item as any).ownerEmail || user?.email || 'user@TrustBox.com';
  const isShared = (item.item as any).isShared || Boolean((item.item as any).shares?.length) || Boolean((item.item as any).isSharedWithMe);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs border border-blue-100 dark:border-zinc-700">
              {isFile ? <FileText size={20} /> : <Folder size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {item.item.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {getFriendlyType(item.item.name, file?.mimeType, !isFile)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isFile && (
          <div className="flex items-center gap-2 my-3 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'details'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              <History size={13} />
              Version History
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {activeTab === 'details' ? (
          <div className="overflow-y-auto pr-1 space-y-3.5 flex-1 text-xs">
            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Name</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 break-all text-sm select-all">{item.item.name}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-500" /> Location
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[260px]">{locationPath}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <User size={13} className="text-indigo-500" /> Created by
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{createdByEmail}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-500" /> Uploaded
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{uploadedTimeStr}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Clock size={13} className="text-rose-500" /> Modified
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{modifiedStr}</span>
            </div>

            {isFile && (
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-zinc-800/60 border border-blue-200/70 dark:border-zinc-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <HardDrive size={13} className="text-blue-600 dark:text-blue-400" /> Size
                  </span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 text-sm">{formatEncryptedSize(rawBytes)}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-zinc-700/50">
                  <Info size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>The encrypted data is slightly larger due to envelope encryption overhead.</span>
                </div>
              </div>
            )}
          </div>
        ) : (

          <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
            {versionsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 size={24} className="animate-spin text-purple-500" />
                <span>Loading past file versions...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <History size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No previous versions available</p>
              </div>
            ) : (
              versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
                      v{ver.versionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          Version {ver.versionNumber} {idx === 0 && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">Active</span>}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {formatOriginalSize(Number(ver.size))} • {new Date(ver.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => handleRestoreVersion(ver.id)}
                      disabled={restoringVersionId === ver.id}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {restoringVersionId === ver.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      Restore
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          {isFile && file && onDownload && (
            <button
              onClick={() => onDownload(file)}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          )}

          {onShare && (
            <button
              onClick={() => {
                onClose();
                onShare(item.item, item.type);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
