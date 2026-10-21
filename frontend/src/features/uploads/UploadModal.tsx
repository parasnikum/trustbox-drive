import React, { useRef, useEffect, useState } from 'react';
import { X, UploadCloud, File, FolderUp, FileUp, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { useUploadStore } from '../../stores/uploadStore';
import { useFileStore } from '../../stores/fileStore';
import { scanDroppedItems } from '../../utils/dropScanner';

export const UploadModal: React.FC = () => {
  const { queue, isUploadModalOpen, setUploadModalOpen, uploadFiles, cancelUpload, clearCompleted } = useUploadStore();
  const { createFolder } = useFileStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUploadModalOpen) {
        setUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadModalOpen, setUploadModalOpen]);

  if (!isUploadModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      setUploadModalOpen(false);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      setUploadModalOpen(false);
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
      setUploadModalOpen(false);
    } catch (err) {
      console.error('Create folder error:', err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in"
      onClick={() => setUploadModalOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Upload Files & Folders
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select individual files or an entire directory structure to import into CloudNest.
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl bg-blue-50/70 dark:bg-zinc-800/60 border border-blue-200/80 dark:border-zinc-700/60 hover:bg-blue-100/70 dark:hover:bg-zinc-800 text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FileUp size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Upload Files</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Documents, images, videos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-zinc-800/60 border border-indigo-200/80 dark:border-zinc-700/60 hover:bg-indigo-100/70 dark:hover:bg-zinc-800 text-left transition-all cursor-pointer group flex flex-col items-start gap-2"
          >
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FolderUp size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Upload Folder</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Entire directory with files</p>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const files = await scanDroppedItems(e.dataTransfer);
            if (files.length > 0) {
              uploadFiles(files);
              setUploadModalOpen(false);
            }
          }}
          className="group border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 transition-all duration-200 mb-5"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110">
            <UploadCloud size={24} />
          </div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Or drag & drop files or folders directly here
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Preserves full parent & nested subfolder structures automatically
          </p>
        </div>

        {!showCreateFolder ? (
          <button
            type="button"
            onClick={() => setShowCreateFolder(true)}
            className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mb-4"
          >
            <PlusCircle size={15} className="text-blue-500" />
            <span>Create New Empty Folder</span>
          </button>
        ) : (
          <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-2 mb-4">
            <input
              type="text"
              autoFocus
              required
              placeholder="New Folder Name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isCreatingFolder}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateFolder(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-medium"
            >
              Cancel
            </button>
          </form>
        )}

        {queue.length > 0 && (
          <div className="max-h-52 overflow-y-auto flex flex-col gap-2.5 pr-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1">
              <span>Upload Progress Queue ({queue.length})</span>
              <button
                onClick={clearCompleted}
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold"
              >
                Clear Completed
              </button>
            </div>

            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <File size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {item.file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.storageProvider && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-zinc-700">
                        {item.storageProvider}
                      </span>
                    )}
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : item.status === 'ERROR' ? (
                      <AlertCircle size={16} className="text-rose-500" />
                    ) : (
                      <button
                        onClick={() => cancelUpload(item.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      item.status === 'ERROR'
                        ? 'bg-rose-500'
                        : item.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
