import React, { useState } from 'react';
import {
  ArrowLeft,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  Edit3,
  MoreVertical,
  Image as ImageIcon,
  Plus,
  Share2,
} from 'lucide-react';
import { PhotoAlbum, PhotoItem } from '../../types';
import { usePhotoStore } from '../../stores/photoStore';
import { PhotoCard } from './PhotoCard';
import { ensureFreshToken } from '../../services/apiClient';

interface AlbumDetailViewProps {
  album: PhotoAlbum;
  onBack: () => void;
  onOpenAddPhotosModal: () => void;
  onOpenUpload: () => void;
  onShareAlbum?: (album: PhotoAlbum) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  onBack,
  onOpenAddPhotosModal,
  onOpenUpload,
  onShareAlbum,
}) => {
  const {
    photos,
    selectedPhotoIds,
    toggleSelect,
    openLightbox,
    toggleStar,
    deleteAlbum,
    updateAlbum,
    removePhotosFromAlbum,
    gridDensity,
  } = usePhotoStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(album.name);
  const [editedDesc, setEditedDesc] = useState(album.description || '');

  const albumPhotos = photos;

  const handleSaveTitle = async () => {
    if (editedTitle.trim()) {
      await updateAlbum(album.id, editedTitle.trim(), editedDesc.trim());
      setIsEditingTitle(false);
    }
  };

  const handleBatchDownloadAlbum = async () => {
    const token = (await ensureFreshToken()) || localStorage.getItem('trustBox_token');
    albumPhotos.forEach((photo) => {
      const link = document.createElement('a');
      link.href = `/api/files/${photo.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDeleteThisAlbum = async () => {
    if (window.confirm(`Delete album "${album.name}"? (Photos inside the album will not be deleted from your drive).`)) {
      await deleteAlbum(album.id);
      onBack();
    }
  };

  const gridClass =
    gridDensity === 'compact'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to All Albums</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddPhotosModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Photos</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            <Upload size={14} />
            <span>Upload Media</span>
          </button>

          {albumPhotos.length > 0 && (
            <button
              onClick={handleBatchDownloadAlbum}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
              title="Download all photos in this album"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          <button
            onClick={handleDeleteThisAlbum}
            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete this album"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 mb-6 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-6">

        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={32} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-xl font-bold px-3 py-1.5 rounded-xl border border-blue-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 w-full"
                autoFocus
              />
              <textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                placeholder="Album description"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 w-full resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
                  {album.name}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                  title="Rename album"
                >
                  <Edit3 size={15} />
                </button>
              </div>
              {album.description && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xl">
                  {album.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>{albumPhotos.length} photo{albumPhotos.length === 1 ? '' : 's'} & video{albumPhotos.length === 1 ? '' : 's'}</span>
                <span>•</span>
                <span>Created {new Date(album.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {albumPhotos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-zinc-500">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
            This album is empty
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mb-5">
            Add photos from your existing library or upload new photos directly into this album.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddPhotosModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add from Photos</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Upload size={15} />
              <span>Upload New Photos</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={gridClass}>
          {albumPhotos.map((photo) => {
            const isSelected = selectedPhotoIds.has(photo.id);
            return (
              <div key={photo.id} className="relative group">
                <PhotoCard
                  photo={photo}
                  isSelected={isSelected}
                  hasAnySelection={selectedPhotoIds.size > 0}
                  onSelectToggle={toggleSelect}
                  onOpenLightbox={openLightbox}
                  onToggleStar={toggleStar}
                  compact={gridDensity === 'compact'}
                />

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Remove "${photo.name}" from this album?`)) {
                      await removePhotosFromAlbum(album.id, [photo.id]);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-rose-400 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  title="Remove from album"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
