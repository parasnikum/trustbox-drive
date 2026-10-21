import React from 'react';
import {
  X,
  FolderPlus,
  Download,
  Star,
  Trash2,
  Share2,
} from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { ensureFreshToken } from '../../services/apiClient';

interface BatchPhotosBarProps {
  onAddToAlbum: () => void;
  onShareBatch?: () => void;
}

export const BatchPhotosBar: React.FC<BatchPhotosBarProps> = ({
  onAddToAlbum,
  onShareBatch,
}) => {
  const {
    selectedPhotoIds,
    clearSelection,
    deleteSelected,
    photos,
    toggleStar,
  } = usePhotoStore();

  const count = selectedPhotoIds.size;
  if (count === 0) return null;

  const handleBatchStar = () => {
    const selectedList = photos.filter((p) => selectedPhotoIds.has(p.id));
    const allStarred = selectedList.every((p) => p.isStarred);
    selectedList.forEach((p) => toggleStar(p.id, allStarred));
  };

  const handleBatchDownload = async () => {
    const token = (await ensureFreshToken()) || localStorage.getItem('trustBox_token');
    selectedPhotoIds.forEach((id) => {
      const link = document.createElement('a');
      link.href = `/api/files/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-zinc-900/95 text-white border border-slate-700/80 dark:border-zinc-700/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom duration-200">

      <div className="flex items-center gap-2 pr-2 border-r border-slate-700 dark:border-zinc-700">
        <span className="text-xs font-bold text-blue-400">
          {count} selected
        </span>
        <button
          onClick={clearSelection}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Deselect all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onAddToAlbum}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <FolderPlus size={14} />
          <span>Add to Album</span>
        </button>

        <button
          onClick={handleBatchStar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
          title="Toggle favorites for selected items"
        >
          <Star size={14} />
          <span className="hidden sm:inline">Favorite</span>
        </button>

        <button
          onClick={handleBatchDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Download selected"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm(`Move ${count} item(s) to trash?`)) {
              deleteSelected();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          title="Move selected to trash"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Trash</span>
        </button>
      </div>
    </div>
  );
};
