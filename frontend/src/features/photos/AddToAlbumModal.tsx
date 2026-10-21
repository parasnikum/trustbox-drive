import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Plus, Check, Image as ImageIcon } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';

interface AddToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileIds: string[];
  onOpenCreateAlbum: () => void;
}

export const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({
  isOpen,
  onClose,
  fileIds,
  onOpenCreateAlbum,
}) => {
  const { albums, fetchAlbums, addPhotosToAlbum } = usePhotoStore();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
    }
  }, [isOpen, fetchAlbums]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedAlbumId || fileIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPhotosToAlbum(selectedAlbumId, fileIds);
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
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Add to Album
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select an album for {fileIds.length} item{fileIds.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenCreateAlbum();
          }}
          className="w-full mb-3 flex items-center gap-3 p-3 rounded-2xl border border-dashed border-blue-400/60 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-xs transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Plus size={16} />
          </div>
          <span>Create New Album with these items</span>
        </button>

        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {albums.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500">
              No albums created yet.
            </div>
          ) : (
            albums.map((album) => {
              const isSelected = selectedAlbumId === album.id;
              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{album.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {album.itemCount} items
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedAlbumId || isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Adding...' : 'Add to Album'}
          </button>
        </div>
      </div>
    </div>
  );
};
