import React, { useEffect, useState } from 'react';
import {
  Folder,
  Home,
  HardDrive,
  Trash2,
  Clock,
  Users,
  Star,
  User,
  Plus,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Briefcase,
  ChevronDown,
  PlusCircle,
  Settings,
  HelpCircle,
  ChevronRight,
  FolderPlus,
  Image as ImageIcon,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useAuthStore } from '../../stores/authStore';
import { useUploadStore } from '../../stores/uploadStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { TrustBoxLogo } from '../../features/marketing/TrustBoxLogo';

export type ViewType = 'drive' | 'photos' | 'computer' | 'starred' | 'recent' | 'shared' | 'storage' | 'account' | 'trash' | '404';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType, tab?: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    setTrashView,
    setRecentView,
    setStarredView,
    setSharedView,
    setSharedSubTab,
    sharedSubTab,
    navigateToFolder,
    folders,
  } = useFileStore();
  const { user } = useAuthStore();
  const { setUploadModalOpen } = useUploadStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const {
    workspaces,
    activeWorkspace,
    fetchWorkspaces,
    selectWorkspace,
    setCreateModalOpen,
    setMembersModalOpen,
  } = useWorkspaceStore();

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const storageUsedBytes = BigInt(user?.storageUsed || '0');
  const storageQuotaBytes = BigInt(user?.storageQuota || '2147483648');

  const storageUsedNum = Number(storageUsedBytes);
  const storageQuotaNum = Number(storageQuotaBytes);
  const storageUsedDisplay = storageUsedNum < 1024 * 1024 * 1024
    ? `${(storageUsedNum / (1024 * 1024)).toFixed(1)} MB`
    : `${(storageUsedNum / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  const storageQuotaDisplay = `${(storageQuotaNum / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  const percentage = storageQuotaNum > 0 ? Math.min(100, Math.round((storageUsedNum / storageQuotaNum) * 100)) : 0;

  const handleDriveClick = () => {
    navigateToFolder(null);
    onSelectView('drive');
    onCloseMobile();
  };

  const handlePhotosClick = () => {
    onSelectView('photos');
    onCloseMobile();
  };

  const handleSharedWithMeClick = () => {
    setSharedView(true);
    setSharedSubTab('shared-with-me');
    onSelectView('shared');
    onCloseMobile();
  };

  const handleRecentClick = () => {
    setRecentView(true);
    onSelectView('recent');
    onCloseMobile();
  };

  const handleStarredClick = () => {
    setStarredView(true);
    onSelectView('starred');
    onCloseMobile();
  };

  const handleAccountClick = (tab = 'profile') => {
    onSelectView('account', tab);
    onCloseMobile();
  };

  const handleTrashClick = () => {
    setTrashView(true);
    onSelectView('trash');
    onCloseMobile();
  };

  const handleStorageClick = () => {
    onSelectView('storage');
    onCloseMobile();
  };

  const navItems = [
    {
      id: 'drive',
      label: 'My Files',
      icon: HardDrive,
      onClick: handleDriveClick,
      isActive: activeView === 'drive',
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: ImageIcon,
      onClick: handlePhotosClick,
      isActive: activeView === 'photos',
    },
    {
      id: 'shared-with-me',
      label: 'Shared',
      icon: Users,
      onClick: handleSharedWithMeClick,
      isActive: activeView === 'shared',
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: Clock,
      onClick: handleRecentClick,
      isActive: activeView === 'recent',
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      onClick: handleStarredClick,
      isActive: activeView === 'starred',
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      onClick: handleTrashClick,
      isActive: activeView === 'trash',
    },
  ];

  return (
    <>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between transition-all duration-300 ease-in-out md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'
          } ${isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64'}`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">

          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <button
              onClick={handleDriveClick}
              className={`flex items-center gap-2.5 transition-opacity hover:opacity-90 text-left cursor-pointer ${isCollapsed ? 'mx-auto' : ''
                }`}
              title="TrustBox Drive"
            >
              <TrustBoxLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
            </button>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X size={18} />
            </button>

            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Collapse Sidebar (Ctrl+B)"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>

          {isCollapsed && (
            <div className="hidden md:flex justify-center pb-2">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Expand Sidebar (Ctrl+B)"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          )}

          <div className="px-4 mb-4 mt-1">
            <button
              onClick={() => {
                setUploadModalOpen(true);
                onCloseMobile();
              }}
              className={`bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center shadow-md shadow-blue-500/25 transition-all duration-150 cursor-pointer ${isCollapsed
                ? 'w-10 h-10 mx-auto rounded-xl p-0'
                : 'w-full py-2.5 px-4 rounded-2xl gap-2'
                }`}
              title="Upload Files"
            >
              <Plus size={16} strokeWidth={2.5} />
              {!isCollapsed && <span>Upload Files</span>}
            </button>
          </div>

          {!isCollapsed && (
            <div className="px-4 mb-4 relative">
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                  className="flex-1 flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:border-blue-500/50 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {activeWorkspace ? (
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {activeWorkspace ? activeWorkspace.name : 'Personal Workspace'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-zinc-400 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {activeWorkspace && (
                  <button
                    onClick={() => {
                      setMembersModalOpen(true);
                      onCloseMobile();
                    }}
                    className="p-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40 transition-all shrink-0 cursor-pointer"
                    title="Workspace Members"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isWorkspaceDropdownOpen && (
                <div className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 space-y-1 animate-fade-in">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
                    Select Workspace
                  </div>

                  <button
                    onClick={() => {
                      selectWorkspace(null);
                      setIsWorkspaceDropdownOpen(false);
                      handleDriveClick();
                      window.history.pushState(null, '', '/drive');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${!activeWorkspace
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Personal Workspace</span>
                    </div>
                  </button>

                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        selectWorkspace(ws);
                        setIsWorkspaceDropdownOpen(false);
                        handleDriveClick();
                        window.history.pushState(null, '', `/w/${ws.id}/drive`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${activeWorkspace?.id === ws.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md">
                        {ws.role}
                      </span>
                    </button>
                  ))}

                  <div className="pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-2xl transition-all duration-150 cursor-pointer ${isCollapsed
                    ? 'w-10 h-10 justify-center mx-auto p-0'
                    : 'gap-3 px-3.5 py-2 text-xs font-medium text-left w-full'
                    } ${item.isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 ${item.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'
                      }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="my-3 mx-4 border-t border-slate-200 dark:border-zinc-800" />

        </div>

        <div className={`p-4 border-t border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleStorageClick}
                title={`Storage: ${storageUsedDisplay} of ${storageQuotaDisplay} (${percentage}%)`}
                className="w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
              >
                <HardDrive size={15} />
                <span className="text-[8px] font-bold mt-0.5">{percentage}%</span>
              </button>

              <button
                onClick={() => handleAccountClick('profile')}
                title="Account Settings"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
              >
                <User size={15} />
              </button>
            </div>
          ) : (
            <div>

              <div className="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Storage</span>
                  <span className="text-slate-400 dark:text-zinc-400 text-[11px]">
                    {storageUsedDisplay} / {storageQuotaDisplay}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <button
                  onClick={handleStorageClick}
                  className="w-full text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  View Storage Breakdown →
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-slate-400 dark:text-zinc-400">
                <button
                  onClick={() => alert('CloudNest Help & Keyboard shortcuts: Press ⌘K for search.')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Help & Shortcuts"
                >
                  <HelpCircle size={16} />
                </button>
                <button
                  onClick={() => handleAccountClick('security')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Security Settings"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => handleAccountClick('profile')}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="User Profile"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[80px]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
