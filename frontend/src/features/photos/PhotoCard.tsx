import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  Circle,
  Play,
  Film,
  Download,
  Trash2,
  MoreVertical,
  PlusCircle,
  FolderPlus,
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { ensureFreshToken } from '../../services/apiClient';

interface PhotoCardProps {
  photo: PhotoItem;
  isSelected: boolean;
  hasAnySelection: boolean;
  onSelectToggle: (id: string) => void;
  onOpenLightbox: (photo: PhotoItem) => void;
  onToggleStar: (id: string, currentStarred: boolean) => void;
  onAddToAlbum?: (photo: PhotoItem) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isSelected,
  hasAnySelection,
  onSelectToggle,
  onOpenLightbox,
  onToggleStar,
  onAddToAlbum,
  onDelete,
  compact = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const storeToken = useAuthStore((s) => s.token);
  const token = storeToken || localStorage.getItem('trustBox_token');
  const previewSrc = `${photo.previewUrl}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = Number(bytesStr);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer select-none border transition-all duration-200 bg-slate-100 dark:bg-zinc-900 ${isSelected
          ? 'border-blue-600 ring-2 ring-blue-500 shadow-md scale-[0.98]'
          : 'border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500/50 hover:shadow-md'
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || hasAnySelection) {
          e.stopPropagation();
          onSelectToggle(photo.id);
        } else {
          onOpenLightbox(photo);
        }
      }}
    >

      {photo.isVideo ? (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
          <video
            src={previewSrc}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 text-blue-600 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={18} className="fill-current ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
            <Film size={11} />
            <span>VIDEO</span>
          </div>
        </div>
      ) : imageError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-slate-100 dark:bg-zinc-800">
          <span className="text-xs font-semibold truncate max-w-full">{photo.name}</span>
          <span className="text-[10px] opacity-60 mt-1 uppercase">Image</span>
        </div>
      ) : (
        <img
          src={previewSrc}
          alt={photo.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}

      <div
        className={`absolute inset-x-0 top-0 p-2 flex items-center justify-between transition-opacity duration-150 bg-gradient-to-b from-black/50 via-black/20 to-transparent ${isHovered || isSelected || photo.isStarred || hasAnySelection
            ? 'opacity-100'
            : 'opacity-0'
          }`}
      >

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle(photo.id);
          }}
          className={`p-1 rounded-xl transition-all cursor-pointer ${isSelected
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-black/30'
            }`}
          title={isSelected ? 'Deselect photo' : 'Select photo'}
        >
          {isSelected ? (
            <CheckCircle2 size={18} className="fill-blue-600 text-white" />
          ) : (
            <Circle size={18} className="text-white drop-shadow" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(photo.id, photo.isStarred);
          }}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${photo.isStarred
              ? 'text-amber-400 drop-shadow'
              : 'text-white/80 hover:text-amber-400 hover:bg-black/30'
            }`}
          title={photo.isStarred ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            size={16}
            className={photo.isStarred ? 'fill-amber-400 text-amber-400' : 'text-white'}
          />
        </button>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent text-white transition-opacity duration-200 flex items-end justify-between ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-xs font-semibold truncate drop-shadow-sm">{photo.name}</p>
          <p className="text-[10px] text-white/80 font-medium">
            {formatSize(photo.size)}
          </p>
        </div>

        {onAddToAlbum && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToAlbum(photo);
            }}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="Add to album"
          >
            <FolderPlus size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
