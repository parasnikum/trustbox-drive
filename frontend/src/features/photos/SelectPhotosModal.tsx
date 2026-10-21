import React, { useState, useEffect } from 'react';
import { X, Check, Search, Image as ImageIcon } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useAuthStore } from '../../stores/authStore';
import { PhotoItem } from '../../types';

interface SelectPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  alreadyInAlbumIds: string[];
}

export const SelectPhotosModal: React.FC<SelectPhotosModalProps> = ({
  isOpen,
  onClose,
  albumId,
  alreadyInAlbumIds,
}) => {
  const { photos, fetchPhotos, addPhotosToAlbum } = usePhotoStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
      setSelectedIds(new Set());
    }
  }, [isOpen, fetchPhotos]);

  if (!isOpen) return null;

  const alreadySet = new Set(alreadyInAlbumIds);
  const availablePhotos = photos.filter(
    (p) => !alreadySet.has(p.id) && (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const toggleSelectPhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPhotosToAlbum(albumId, Array.from(selectedIds));
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Add Photos to Album
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search photos by filename..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {availablePhotos.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No photos available to add.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {availablePhotos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                const storeToken = useAuthStore.getState().token;
                const token = storeToken || localStorage.getItem('trustBox_token');
                const src = `${photo.previewUrl}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

                return (
                  <div
                    key={photo.id}
                    onClick={() => toggleSelectPhoto(photo.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all ${isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500 shadow-md scale-[0.96]'
                        : 'border-slate-200 dark:border-zinc-800 hover:opacity-90'
                      }`}
                  >
                    <img
                      src={src}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/40 text-transparent border border-white/60'
                        }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-200 dark:border-zinc-800">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
            {selectedIds.size} photo{selectedIds.size === 1 ? '' : 's'} chosen
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add to Album'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
