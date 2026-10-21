import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './stores/authStore';
import { useFileStore } from './stores/fileStore';
import { useSidebarStore } from './stores/sidebarStore';
import { SyncEngine } from './services/syncEngine';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ViewType } from './components/layout/Sidebar';
import { FileBrowser } from './features/files/FileBrowser';
import { PreviewModal } from './features/files/PreviewModal';
import { ShareModal } from './features/sharing/ShareModal';
import { StorageDashboard } from './features/storage/StorageDashboard';
import { MyComputer } from './features/computer/MyComputer';
import { AccountSettingsView } from './features/auth/AccountSettingsView';
import { StorageUsageView } from './features/storage/StorageUsageView';
import { UploadModal } from './features/uploads/UploadModal';
import { UploadFloatingWidget } from './features/uploads/UploadFloatingWidget';
import { AuthScreen } from './features/auth/AuthScreen';
import { LandingPage } from './features/marketing/LandingPage';
import { PricingPage } from './features/marketing/PricingPage';
import { FeaturesPage } from './features/marketing/FeaturesPage';
import { SecurityPage } from './features/marketing/SecurityPage';
import { DocsPage } from './features/marketing/DocsPage';
import { AboutPage } from './features/marketing/AboutPage';
import { ProfileModal } from './features/auth/ProfileModal';
import { PublicShareView } from './features/sharing/PublicShareView';
import { PhotosView } from './features/photos/PhotosView';
import { CreateWorkspaceModal } from './features/workspaces/CreateWorkspaceModal';
import { WorkspaceMembersModal } from './features/workspaces/WorkspaceMembersModal';
import { NotFoundView } from './components/common/NotFoundView';
import { FileItem, FolderItem } from './types';
import { ArrowLeft } from 'lucide-react';

import { useWorkspaceStore } from './stores/workspaceStore';
import { ensureFreshToken } from './services/apiClient';

export const App: React.FC = () => {
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const {
    fetchItems,
    handleRealTimeEvent,
    navigateToFolder,
    setStarredView,
    setRecentView,
    setTrashView,
    setSharedView,
    setSharedSubTab,
  } = useFileStore();

  const [activeView, setActiveView] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'drive';
    const p = window.location.pathname;
    if (p.startsWith('/profile') || p.startsWith('/account')) return 'account';
    if (p.startsWith('/storage')) return 'storage';
    if (p.startsWith('/recent')) return 'recent';
    if (p.startsWith('/starred')) return 'starred';
    if (p.startsWith('/trash')) return 'trash';
    if (p.startsWith('/shared')) return 'shared';
    if (p.startsWith('/photos')) return 'photos';
    if (p.startsWith('/computer')) return 'computer';
    return 'drive';
  });
  const [accountTab, setAccountTab] = useState<'profile' | 'security' | 'storage' | 'preferences' | 'apps' | 'billing'>(() => {
    if (typeof window === 'undefined') return 'profile';
    const p = window.location.pathname;
    if (p.endsWith('/security')) return 'security';
    if (p.endsWith('/storage')) return 'storage';
    if (p.endsWith('/billing')) return 'billing';
    if (p.endsWith('/preferences')) return 'preferences';
    if (p.endsWith('/apps')) return 'apps';
    return 'profile';
  });
  const [showAdminStorage, setShowAdminStorage] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<{ type: 'file' | 'folder'; item: FileItem | FolderItem } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

  const navigateTo = useCallback((newPath: string) => {
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    setCurrentPath(newPath);
  }, []);

  const parsePathAndSyncState = useCallback(() => {
    let path = window.location.pathname;

    const marketingPaths = ['/', '', '/landing', '/showcase', '/features', '/pricing', '/security', '/docs', '/about', '/login', '/register', '/signup', '/forgot-password'];
    if (marketingPaths.includes(path)) {
      return;
    }

    if (path.startsWith('/w/')) {
      const parts = path.split('/').filter(Boolean);
      const wsId = parts[1];
      const subPath = '/' + parts.slice(2).join('/');

      const wsList = useWorkspaceStore.getState().workspaces;
      const targetWs = wsList.find((w) => w.id === wsId);
      if (targetWs) {
        if (useWorkspaceStore.getState().activeWorkspace?.id !== targetWs.id) {
          useWorkspaceStore.getState().selectWorkspace(targetWs);
        }
      } else {
        useWorkspaceStore.getState().selectWorkspace(null);
        window.history.replaceState(null, '', subPath || '/drive');
      }

      path = subPath || '/drive';
    } else {
      if (useWorkspaceStore.getState().activeWorkspace !== null) {
        useWorkspaceStore.getState().selectWorkspace(null);
      }
    }

    if (path === '/drive') {
      setActiveView('drive');
      useFileStore.setState({
        currentFolderId: null,
        isTrashView: false,
        isStarredView: false,
        isRecentView: false,
        isSharedView: false,
        folderPathHistory: [{ id: null, name: 'My Files' }],
      });
      fetchItems(null, false);
    } else if (path.startsWith('/folder/')) {
      const folderId = path.replace('/folder/', '').trim();
      setActiveView('drive');
      useFileStore.setState({
        isTrashView: false,
        isStarredView: false,
        isRecentView: false,
        isSharedView: false,
      });
      if (folderId) {
        navigateToFolder(folderId);
      } else {
        navigateToFolder(null);
      }
    } else if (path === '/starred') {
      setActiveView('starred');
      setStarredView(true);
    } else if (path === '/recent') {
      setActiveView('recent');
      setRecentView(true);
    } else if (path === '/trash') {
      setActiveView('trash');
      setTrashView(true);
    } else if (path.startsWith('/shared')) {
      setActiveView('shared');
      setSharedView(true);
      if (path === '/shared/by-me') {
        setSharedSubTab('shared-by-me');
      } else {
        setSharedSubTab('shared-with-me');
      }
    } else if (path.startsWith('/photos')) {
      setActiveView('photos');
    } else if (path === '/storage') {
      setActiveView('storage');
    } else if (path === '/computer') {
      setActiveView('computer');
    } else if (path.startsWith('/profile') || path.startsWith('/account')) {
      setActiveView('account');
      if (path.endsWith('/security')) {
        setAccountTab('security');
      } else if (path.endsWith('/storage')) {
        setAccountTab('storage');
      } else if (path.endsWith('/billing')) {
        setAccountTab('billing');
      } else if (path.endsWith('/preferences')) {
        setAccountTab('preferences');
      } else if (path.endsWith('/apps')) {
        setAccountTab('apps');
      } else {
        setAccountTab('profile');
      }
    } else if (!path.startsWith('/s/') && !['/', '', '/landing', '/showcase', '/features', '/pricing', '/security', '/docs', '/about', '/login', '/register', '/signup', '/forgot-password'].includes(path)) {
      setActiveView('404');
    }
  }, [navigateToFolder, setStarredView, setRecentView, setTrashView, setSharedView, setSharedSubTab, fetchItems]);

  if (window.location.pathname.startsWith('/s/')) {
    return <PublicShareView />;
  }

  useEffect(() => {
    parsePathAndSyncState();
    fetchCurrentUser();

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      parsePathAndSyncState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parsePathAndSyncState, fetchCurrentUser]);

  useEffect(() => {
    const renewIfLoggedIn = () => {
      if (localStorage.getItem('trustBox_token') || localStorage.getItem('TrustBox_refresh_token')) {
        ensureFreshToken().catch(() => { });
      }
    };

    window.addEventListener('focus', renewIfLoggedIn);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        renewIfLoggedIn();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(renewIfLoggedIn, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', renewIfLoggedIn);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {

      useWorkspaceStore.getState().fetchWorkspaces().then(() => {
        parsePathAndSyncState();
      });

      const syncEngine = SyncEngine.getInstance();
      syncEngine.connect(user.id);
      setIsWsConnected(true);

      const unsubscribe = syncEngine.subscribe((event) => {
        handleRealTimeEvent(event);
      });

      return () => {
        unsubscribe();
        syncEngine.disconnect();
      };
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        setPreviewFile(null);
        setShareTarget(null);
        setIsProfileOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const { toggleSidebar } = useSidebarStore.getState();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectView = (v: ViewType, tab?: string) => {
    setShowAdminStorage(false);
    setActiveView(v);

    const activeWs = useWorkspaceStore.getState().activeWorkspace;
    const wsPrefix = activeWs ? `/w/${activeWs.id}` : '';

    let subPath = '/drive';
    if (v === 'drive') {
      subPath = '/drive';
      useFileStore.setState({
        currentFolderId: null,
        isTrashView: false,
        isStarredView: false,
        isRecentView: false,
        isSharedView: false,
        folderPathHistory: [{ id: null, name: 'My Files' }],
      });
      fetchItems(null, false);
    } else if (v === 'starred') {
      subPath = '/starred';
      setStarredView(true);
    } else if (v === 'recent') {
      subPath = '/recent';
      setRecentView(true);
    } else if (v === 'trash') {
      subPath = '/trash';
      setTrashView(true);
    } else if (v === 'shared') {
      subPath = '/shared';
      setSharedView(true);
    } else if (v === 'photos') subPath = '/photos';
    else if (v === 'computer') subPath = '/computer';
    else if (v === 'storage') subPath = '/storage';
    else if (v === 'account') {
      const selectedTab = tab || accountTab || 'profile';
      setAccountTab(selectedTab as any);
      if (selectedTab === 'security') subPath = '/profile/security';
      else if (selectedTab === 'profile') subPath = '/profile';
      else subPath = `/profile/${selectedTab}`;
    }

    const targetPath = `${wsPrefix}${subPath}`;
    navigateTo(targetPath);
  };

  const handleOpenDrive = () => {
    navigateTo('/drive');
    parsePathAndSyncState();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigateTo('/drive');
      parsePathAndSyncState();
    } else {
      navigateTo('/signup');
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigateTo('/drive');
      parsePathAndSyncState();
    } else {
      navigateTo('/login');
    }
  };

  if (currentPath === '/' || currentPath === '' || currentPath === '/landing' || currentPath === '/showcase') {
    return (
      <LandingPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/pricing') {
    return (
      <PricingPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/features') {
    return (
      <FeaturesPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/security') {
    return (
      <SecurityPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/docs') {
    return (
      <DocsPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/about') {
    return (
      <AboutPage
        isAuthenticated={isAuthenticated}
        onOpenDrive={handleOpenDrive}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        onNavigate={navigateTo}
      />
    );
  }

  if (
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/signup' ||
    currentPath === '/forgot-password'
  ) {
    if (isAuthenticated) {

      navigateTo('/drive');
      parsePathAndSyncState();
    } else {
      return (
        <AuthScreen
          onBackToLanding={() => navigateTo('/')}
          initialRegister={currentPath === '/register' || currentPath === '/signup'}
        />
      );
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onBackToLanding={() => navigateTo('/')}
        initialRegister={false}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans antialiased transition-colors">

      <Sidebar
        activeView={activeView}
        onSelectView={(v, tab) => handleSelectView(v, tab)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
        <Navbar
          onToggleStorageDashboard={() => setShowAdminStorage(!showAdminStorage)}
          showStorageDashboard={showAdminStorage}
          isWsConnected={isWsConnected}
          onOpenProfile={() => handleSelectView('account', 'profile')}
          isMobileOpen={isMobileOpen}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onViewLanding={() => navigateTo('/')}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50 dark:bg-zinc-950 transition-colors">
          {showAdminStorage && user?.role === 'ADMIN' ? (
            <StorageDashboard />
          ) : activeView === '404' ? (
            <NotFoundView onGoHome={() => handleSelectView('drive')} />
          ) : activeView === 'computer' ? (
            <MyComputer />
          ) : activeView === 'account' ? (
            <AccountSettingsView
              initialTab={accountTab}
              onTabChange={(t) => {
                setAccountTab(t as any);
                const path = t === 'security' ? '/profile/security' : t === 'profile' ? '/profile' : `/profile/${t}`;
                navigateTo(path);
              }}
            />
          ) : activeView === 'storage' ? (
            <StorageUsageView />
          ) : activeView === 'photos' ? (
            <PhotosView
              onSharePhoto={(photo) => {
                setShareTarget({
                  type: 'file',
                  item: {
                    id: photo.id,
                    name: photo.name,
                    mimeType: photo.mimeType,
                    size: photo.size,
                    ownerId: photo.ownerId,
                    isTrash: false,
                    checksum: '',
                    createdAt: photo.createdAt,
                    updatedAt: photo.updatedAt,
                    parentId: photo.parentId,
                  },
                });
              }}
            />
          ) : (
            <FileBrowser
              onPreviewFile={(file) => setPreviewFile(file)}
              onShareItem={(item, type) => setShareTarget({ type, item })}
            />
          )}
        </main>
      </div>

      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <ShareModal item={shareTarget} onClose={() => setShareTarget(null)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <UploadModal />
      <UploadFloatingWidget />
      <CreateWorkspaceModal />
      <WorkspaceMembersModal />
    </div>
  );
};

export default App;
