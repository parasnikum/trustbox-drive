import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  FolderPlus,
  Upload,
  Calendar,
  Star,
  Film,
  Grid,
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  Share2,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUploadStore } from '../../stores/uploadStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { apiClient } from '../../services/apiClient';
import { PhotoCard } from './PhotoCard';
import { PhotoLightbox } from './PhotoLightbox';
import { CreateAlbumModal } from './CreateAlbumModal';
import { AddToAlbumModal } from './AddToAlbumModal';
import { AlbumDetailView } from './AlbumDetailView';
import { SelectPhotosModal } from './SelectPhotosModal';
import { BatchPhotosBar } from './BatchPhotosBar';
import { PhotoAlbum, PhotoItem } from '../../types';

interface PhotosViewProps {
  onSharePhoto?: (photo: PhotoItem) => void;
}

export const PhotosView: React.FC<PhotosViewProps> = ({ onSharePhoto }) => {
  const {
    photos,
    timeline,
    albums,
    activeAlbum,
    activeFilter,
    searchQuery,
    selectedPhotoIds,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    stats,
    gridDensity,
    lightboxItem,
    setGridDensity,
    setActiveFilter,
    setSearchQuery,
    fetchPhotos,
    fetchNextPage,
    fetchTimeline,
    fetchAlbums,
    fetchAlbumDetails,
    addPhotosToAlbum,
    deleteAlbum,
    toggleStar,
    toggleSelect,
    selectBatch,
    clearSelection,
    openLightbox,
    closeLightbox,
    nextLightboxItem,
    prevLightboxItem,
  } = usePhotoStore();

  const { uploadFiles } = useUploadStore();

  const [activeTab, setActiveTab] = useState<'timeline' | 'albums' | 'favorites' | 'videos'>('timeline');
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
  const [isSelectPhotosModalOpen, setIsSelectPhotosModalOpen] = useState(false);
  const [selectedPhotoForAlbum, setSelectedPhotoForAlbum] = useState<PhotoItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading || activeTab === 'albums') return;

    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, activeTab, fetchNextPage]);

  useEffect(() => {
    fetchPhotos(1);
    fetchTimeline();
    fetchAlbums();
  }, []);

  const getOrCreatePhotosFolderId = async (): Promise<string | null> => {
    try {
      const activeWs = useWorkspaceStore.getState().activeWorkspace;
      const wsParam = activeWs ? activeWs.id : 'null';
      const res = await apiClient.get('/folders', {
        params: { parentId: 'null', workspaceId: wsParam, isTrash: 'false' },
      });
      const folders = res.data.folders || [];
      const existingPhotosFolder = folders.find(
        (f: any) => f.name.toLowerCase() === 'photos' && !f.isTrash
      );
      if (existingPhotosFolder) {
        return existingPhotosFolder.id;
      }

      const createRes = await apiClient.post('/folders', {
        name: 'Photos',
        parentId: null,
        workspaceId: activeWs ? activeWs.id : null,
      });
      return createRes.data.folder.id;
    } catch (err) {
      console.warn('Could not resolve Photos folder, saving to root:', err);
      return null;
    }
  };

  const handleProcessUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const targetFolderId = await getOrCreatePhotosFolderId();
      const uploadedFiles = await uploadFiles(files, targetFolderId);

      if (activeAlbum && uploadedFiles && uploadedFiles.length > 0) {
        const newIds = uploadedFiles.map((f: any) => f.id).filter(Boolean);
        if (newIds.length > 0) {
          await addPhotosToAlbum(activeAlbum.id, newIds);
        }
      }

      await Promise.all([fetchPhotos(), fetchTimeline()]);
    } catch (err) {
      console.error('Photos upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabChange = (tab: 'timeline' | 'albums' | 'favorites' | 'videos') => {
    setActiveTab(tab);
    if (tab === 'timeline') {
      setActiveFilter('all');
      fetchTimeline();
    } else if (tab === 'albums') {
      fetchAlbums();
    } else if (tab === 'favorites') {
      setActiveFilter('favorites');
    } else if (tab === 'videos') {
      setActiveFilter('videos');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      e.target.value = '';
      handleProcessUpload(files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessUpload(Array.from(e.dataTransfer.files));
    }
  };

  const gridClass =
    gridDensity === 'compact'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4';

  if (activeAlbum) {
    return (
      <>
        <AlbumDetailView
          album={activeAlbum}
          onBack={() => usePhotoStore.setState({ activeAlbum: null })}
          onOpenAddPhotosModal={() => setIsSelectPhotosModalOpen(true)}
          onOpenUpload={handleUploadClick}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <SelectPhotosModal
          isOpen={isSelectPhotosModalOpen}
          onClose={() => setIsSelectPhotosModalOpen(false)}
          albumId={activeAlbum.id}
          alreadyInAlbumIds={activeAlbum.fileIds}
        />
        <PhotoLightbox
          photo={lightboxItem}
          onClose={closeLightbox}
          onNext={nextLightboxItem}
          onPrev={prevLightboxItem}
          onToggleStar={toggleStar}
          onShare={(photo) => onSharePhoto?.(photo)}
        />
      </>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 font-display">
              Photos & Videos
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              {stats.totalCount} items
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage your photo gallery, create albums, and stream high-res videos
          </p>
        </div>

        <div className="flex items-center gap-2">

          <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={() => setGridDensity('comfortable')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridDensity === 'comfortable'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
              title="Comfortable squares"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setGridDensity('compact')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridDensity === 'compact'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
              title="Compact squares"
            >
              <Layers size={15} />
            </button>
          </div>

          <button
            onClick={() => setIsCreateAlbumOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            <FolderPlus size={14} className="text-blue-600 dark:text-blue-400" />
            <span>New Album</span>
          </button>

          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all transform hover:-translate-y-0.2 active:translate-y-0 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Upload Media</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap border-b border-slate-200 dark:border-zinc-800 pb-3">

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTabChange('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar size={13} />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => handleTabChange('albums')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'albums'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FolderPlus size={13} />
            <span>Albums</span>
            {albums.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'albums' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
                {albums.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('favorites')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Star size={13} className={activeTab === 'favorites' ? 'fill-white' : 'text-amber-500'} />
            <span>Favorites</span>
            {stats.favoritesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
                {stats.favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('videos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Film size={13} />
            <span>Videos</span>
            {stats.videosCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'videos' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
                {stats.videosCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media..."
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-5 z-50 pointer-events-none bg-white/95 dark:bg-zinc-950/95 border-2 border-dashed border-blue-500 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xl animate-fade-in">
          <Upload size={48} className="animate-bounce" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-zinc-100">
            Drop photos & videos here to upload
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Full resolution, secure cloud backup
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center h-64 text-slate-400 gap-2 font-medium">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading photos...</span>
        </div>
      ) : activeTab === 'albums' ? (

        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">

            <div
              onClick={() => setIsCreateAlbumOpen(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white/50 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center p-4 cursor-pointer group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                New Album
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                Organize your memories
              </span>
            </div>

            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => fetchAlbumDetails(album.id)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between p-3 select-none"
              >

                <div className="flex-1 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden relative border border-slate-100 dark:border-zinc-700/60 flex items-center justify-center">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-slate-400 opacity-60" />
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                    {album.itemCount} items
                  </span>
                </div>

                <div className="mt-2 min-w-0 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {album.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      Album
                    </span>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete album "${album.name}"?`)) {
                        await deleteAlbum(album.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete album"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'timeline' ? (

        timeline.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-sm">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              No photos or videos yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mb-4">
              Upload photos and videos directly or drag them anywhere into this screen.
            </p>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Photos Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {timeline.map((group) => {
              const allGroupSelected = group.items.every((item) => selectedPhotoIds.has(item.id));
              const someGroupSelected = group.items.some((item) => selectedPhotoIds.has(item.id));

              return (
                <div key={group.label} className="space-y-3">

                  <div className="flex items-center justify-between sticky top-0 z-10 py-1.5 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectBatch(group.items.map((i) => i.id), !allGroupSelected)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                        title={allGroupSelected ? 'Deselect date' : 'Select all in this date'}
                      >
                        {allGroupSelected ? (
                          <CheckCircle2 size={16} className="text-blue-600 fill-blue-600 text-white" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        {group.label}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({group.count})
                      </span>
                    </div>
                  </div>

                  <div className={gridClass}>
                    {group.items.map((photo) => {
                      const isSelected = selectedPhotoIds.has(photo.id);
                      return (
                        <PhotoCard
                          key={photo.id}
                          photo={photo}
                          isSelected={isSelected}
                          hasAnySelection={selectedPhotoIds.size > 0}
                          onSelectToggle={toggleSelect}
                          onOpenLightbox={openLightbox}
                          onToggleStar={toggleStar}
                          onAddToAlbum={(p) => {
                            setSelectedPhotoForAlbum(p);
                            setIsAddToAlbumOpen(true);
                          }}
                          compact={gridDensity === 'compact'}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (

        photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              {activeTab === 'favorites' ? <Star size={32} /> : <Film size={32} />}
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              {activeTab === 'favorites' ? 'No favorites yet' : 'No videos found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
              {activeTab === 'favorites'
                ? 'Click the star icon on any photo or video to add it to your favorites.'
                : 'Upload MP4, WebM, MOV, or MKV videos to view them here.'}
            </p>
          </div>
        ) : (
          <div className={gridClass}>
            {photos.map((photo) => {
              const isSelected = selectedPhotoIds.has(photo.id);
              return (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={isSelected}
                  hasAnySelection={selectedPhotoIds.size > 0}
                  onSelectToggle={toggleSelect}
                  onOpenLightbox={openLightbox}
                  onToggleStar={toggleStar}
                  onAddToAlbum={(p) => {
                    setSelectedPhotoForAlbum(p);
                    setIsAddToAlbumOpen(true);
                  }}
                  compact={gridDensity === 'compact'}
                />
              );
            })}
          </div>
        )
      )}

      {activeTab !== 'albums' && photos.length > 0 && (
        <div ref={observerRef} className="w-full py-6 flex flex-col items-center justify-center min-h-[50px]">
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-zinc-300 animate-fade-in">
              <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
              <span>Loading more memories...</span>
            </div>
          )}
          {!hasMore && photos.length > 20 && (
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-600">
              All {totalCount || photos.length} items loaded
            </p>
          )}
        </div>
      )}

      <BatchPhotosBar
        onAddToAlbum={() => setIsAddToAlbumOpen(true)}
      />

      <PhotoLightbox
        photo={lightboxItem}
        onClose={closeLightbox}
        onNext={nextLightboxItem}
        onPrev={prevLightboxItem}
        onToggleStar={toggleStar}
        onShare={(photo) => onSharePhoto?.(photo)}
      />

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        initialFileIds={Array.from(selectedPhotoIds)}
      />

      <AddToAlbumModal
        isOpen={isAddToAlbumOpen}
        onClose={() => {
          setIsAddToAlbumOpen(false);
          setSelectedPhotoForAlbum(null);
        }}
        fileIds={
          selectedPhotoForAlbum
            ? [selectedPhotoForAlbum.id]
            : Array.from(selectedPhotoIds)
        }
        onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
      />
    </div>
  );
};
