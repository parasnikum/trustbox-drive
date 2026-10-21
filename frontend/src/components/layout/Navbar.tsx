import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  List,
  HardDrive,
  Shield,
  User as UserIcon,
  Laptop,
  CheckCircle2,
  Keyboard,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

interface NavbarProps {
  onToggleStorageDashboard: () => void;
  showStorageDashboard: boolean;
  isWsConnected: boolean;
  onOpenProfile: () => void;
  isMobileOpen: boolean;
  onToggleMobileMenu: () => void;
  onViewLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleStorageDashboard,
  showStorageDashboard,
  isWsConnected,
  onOpenProfile,
  isMobileOpen,
  onToggleMobileMenu,
  onViewLanding,
}) => {
  const { searchQuery, setSearchQuery, layoutMode, setLayoutMode } = useFileStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(target)) {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSecurity = () => {
    setIsUserMenuOpen(false);
    onOpenProfile();
    if (window.location.pathname !== '/profile/security') {
      window.history.pushState(null, '', '/profile/security');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleOpenProfile = () => {
    setIsUserMenuOpen(false);
    onOpenProfile();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-6 py-2.5 flex items-center justify-between transition-colors">

      <div className="flex items-center gap-3 flex-1 max-w-xl">

        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files, folders, or assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-700 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-2.5 shrink-0 ml-3">

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-slate-600" />
          )}
        </button>

        <div className="relative" ref={helpMenuRef}>
          <button
            onClick={() => {
              setIsHelpOpen(!isHelpOpen);
              setIsSettingsOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            title="Help & Shortcuts"
          >
            <HelpCircle size={18} />
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl z-50 animate-fade-in text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-2 text-[10px]">
                <Keyboard size={14} />
                Shortcuts & Status
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Quick Search</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono border border-slate-200 dark:border-zinc-700">⌘K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Toggle Sidebar</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono border border-slate-200 dark:border-zinc-700">Ctrl + B</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Close Dialogs</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono border border-slate-200 dark:border-zinc-700">Esc</kbd>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-zinc-800 my-3" />

              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-400 dark:text-zinc-500">Real-time Sync:</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={13} />
                  {isWsConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              setIsHelpOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 shadow-xl z-50 animate-fade-in">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 py-1 mb-1">
                Workspace Preferences
              </h4>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <span>Account & Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    handleOpenSecurity();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <span>Security & Devices</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onToggleStorageDashboard();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${showStorageDashboard
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <HardDrive size={14} />
                      Storage Analytics
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsHelpOpen(false);
              setIsSettingsOpen(false);
            }}
            className="w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer select-none"
            title={user?.name || 'User Profile'}
          >
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-3 shadow-2xl z-50 animate-fade-in">

              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl mb-2 flex items-center gap-3 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-blue-500/25">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full">
                    {user?.role || 'USER'} ACCOUNT
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={handleOpenProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                >
                  <UserIcon size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Profile & Preferences</span>
                </button>

                <button
                  onClick={handleOpenSecurity}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Security & Devices</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    <Laptop size={11} />
                    <span>Active</span>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-200 dark:bg-zinc-800 my-2" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
              >
                <LogOut size={15} />
                <span>Log Out of Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
