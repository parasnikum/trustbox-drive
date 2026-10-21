import React, { useState } from 'react';
import { X, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFileIds?: string[];
  onAlbumCreated?: (albumId: string) => void;
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  initialFileIds = [],
  onAlbumCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAlbum } = usePhotoStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const album = await createAlbum(name.trim(), description.trim(), initialFileIds);
      if (album && onAlbumCreated) {
        onAlbumCreated(album.id);
      }
      setName('');
      setDescription('');
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                New Photo Album
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Group photos and videos into an album
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Album Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Vacation 2026, Portfolio, Family"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short note or description for this album"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {initialFileIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <ImageIcon size={15} />
              <span>{initialFileIds.length} item(s) will be added to this album</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
