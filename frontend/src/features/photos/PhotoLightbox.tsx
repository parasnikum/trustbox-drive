import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  Star,
  Info,
  Play,
  Pause,
  Trash2,
  Calendar,
  HardDrive,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { ensureFreshToken } from '../../services/apiClient';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleStar: (id: string, currentStarred: boolean) => void;
  onShare: (photo: PhotoItem) => void;
  onDelete?: (id: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  onClose,
  onNext,
  onPrev,
  onToggleStar,
  onShare,
  onDelete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [photo?.id]);

  useEffect(() => {
    if (!isPlayingSlideshow) return;
    const timer = setInterval(() => {
      onNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPlayingSlideshow, onNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        if (photo) onToggleStar(photo.id, photo.isStarred);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose, onNext, onPrev, onToggleStar]);

  useEffect(() => {
    if (photo) {
      ensureFreshToken().catch(() => { });
    }
  }, [photo]);

  if (!photo) return null;

  const storeToken = useAuthStore((s) => s.token);
  const token = storeToken || localStorage.getItem('trustBox_token');
  const mediaUrl = `${photo.previewUrl}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  const downloadUrl = `${photo.downloadUrl}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = Number(bytesStr);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.5));
  const handleZoomOut = () => setZoom((z) => Math.max(1, z - 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200">

      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 z-10 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close viewer (Esc)"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold truncate text-white max-w-xs md:max-w-md">
              {photo.name}
            </h3>
            <span className="text-[11px] text-white/60">
              {new Date(photo.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!photo.isVideo && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Rotate 90°"
              >
                <RotateCw size={18} />
              </button>
              <button
                onClick={() => setIsPlayingSlideshow((prev) => !prev)}
                className={`p-2 rounded-xl transition-colors ${isPlayingSlideshow
                    ? 'bg-blue-600 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                title={isPlayingSlideshow ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlayingSlideshow ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </>
          )}

          <button
            onClick={() => onToggleStar(photo.id, photo.isStarred)}
            className={`p-2 rounded-xl transition-colors ${photo.isStarred
                ? 'text-amber-400'
                : 'text-white/80 hover:text-amber-400 hover:bg-white/10'
              }`}
            title={photo.isStarred ? 'Remove from favorites (F)' : 'Add to favorites (F)'}
          >
            <Star size={18} className={photo.isStarred ? 'fill-amber-400' : ''} />
          </button>

          <button
            onClick={() => onShare(photo)}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Share media link"
          >
            <Share2 size={18} />
          </button>

          <a
            href={downloadUrl}
            download={photo.name}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Download file"
          >
            <Download size={18} />
          </a>

          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors ${showInfo ? 'bg-blue-600 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            title="Info & EXIF metadata (I)"
          >
            <Info size={18} />
          </button>

          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Move "${photo.name}" to trash?`)) {
                  onDelete(photo.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors ml-1"
              title="Move to trash"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">

        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all z-20 backdrop-blur-md shadow-lg"
          title="Previous photo (Left Arrow)"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
          {photo.isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[82vh] max-w-[90vw] rounded-2xl shadow-2xl"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={photo.name}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-[82vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
            />
          )}
        </div>

        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all z-20 backdrop-blur-md shadow-lg"
          title="Next photo (Right Arrow)"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {showInfo && (
        <div className="absolute right-0 top-14 bottom-0 w-80 bg-zinc-950/95 border-l border-white/10 p-5 z-30 overflow-y-auto text-white shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Details & Metadata
            </h4>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 rounded-lg text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider mb-1">
                File Name
              </span>
              <p className="font-semibold text-white break-all">{photo.name}</p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-white/60 flex items-center gap-1.5">
                <FileText size={14} className="text-blue-400" />
                <span>Format</span>
              </span>
              <span className="font-mono text-white/90 uppercase">{photo.mimeType}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-white/60 flex items-center gap-1.5">
                <HardDrive size={14} className="text-emerald-400" />
                <span>File Size</span>
              </span>
              <span className="font-semibold text-white">{formatSize(photo.size)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-white/60 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-400" />
                <span>Uploaded</span>
              </span>
              <span className="text-white/80">
                {new Date(photo.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider mb-2">
                Actions
              </span>
              <div className="flex flex-col gap-2">
                <a
                  href={downloadUrl}
                  download={photo.name}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  <Download size={14} />
                  <span>Download Full Resolution</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
