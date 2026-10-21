import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  CreditCard,
  Sliders,
  Link,
  HardDrive,
  Check,
  Camera,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  Lock,
  Key,
  AlertTriangle,
  Loader2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAuthStore, ActiveSession } from '../../stores/authStore';

interface AccountSettingsViewProps {
  initialTab?: 'profile' | 'storage' | 'security' | 'preferences' | 'apps' | 'billing';
  onTabChange?: (tab: string) => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  initialTab = 'profile',
  onTabChange,
}) => {
  const {
    user,
    activeSessions,
    fetchActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
    changePassword,
    updateProfile,
    logout,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'storage' | 'security' | 'preferences' | 'apps' | 'billing'>(initialTab);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchActiveSessions();
    }
  }, [activeTab]);

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setIsUpdatingProfile(true);
    try {
      await updateProfile(fullName, email);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSingle = async (sessionId: string) => {
    setRevokingId(sessionId);
    setSessionError(null);
    try {
      await revokeSession(sessionId);
    } catch (err: any) {
      setSessionError(err.message || 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (!window.confirm('Are you sure you want to log out all other active devices?')) {
      return;
    }
    setIsRevokingAll(true);
    setSessionError(null);
    try {
      await revokeAllOtherSessions();
    } catch (err: any) {
      setSessionError(err.message || 'Failed to revoke other sessions');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const lower = deviceName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
      return <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (lower.includes('ipad') || lower.includes('tablet')) {
      return <Tablet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <Laptop className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security & Active Devices', icon: Shield },
    // { id: 'storage', label: 'Storage', icon: HardDrive },
    // { id: 'preferences', label: 'Preferences', icon: Sliders },
    // { id: 'apps', label: 'Connected Apps', icon: Link },
    // { id: 'billing', label: 'Billing', icon: CreditCard },
  ] as const;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-8 gap-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">

      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight m-0">
          Account & Device Settings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
          Manage your security settings, active login devices, session revoking, and personal details.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-2 h-fit shadow-xs shrink-0 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-left transition-all duration-150 whitespace-nowrap cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs">

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white m-0">
                Personal Profile
              </h3>

              {profileError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-blue-500/20">
                    {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {fullName || user?.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                </div>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white m-0 flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-blue-600" />
                      Active Devices & Logged-In Sessions
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                      Devices currently authenticated to your account via HttpOnly JWT refresh tokens. Revoke any session instantly.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchActiveSessions()}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Refresh sessions list"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                    {activeSessions.length > 1 && (
                      <button
                        onClick={handleRevokeAllOther}
                        disabled={isRevokingAll}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isRevokingAll ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        <span>Revoke All Other Devices</span>
                      </button>
                    )}
                  </div>
                </div>

                {sessionError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{sessionError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {activeSessions.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      No active device sessions found.
                    </div>
                  ) : (
                    activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${session.isCurrent
                          ? 'bg-blue-50/50 dark:bg-zinc-800/60 border-blue-200/80 dark:border-zinc-700/60 shadow-xs'
                          : 'bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700/60'
                          }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                            {getDeviceIcon(session.deviceName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                {session.deviceName}
                              </span>
                              {session.isCurrent && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-600 text-white rounded-full">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-zinc-400" />
                                {session.ipAddress || '127.0.0.1'}
                              </span>
                              <span>•</span>
                              <span>Active: {formatRelativeTime(session.lastActiveAt)}</span>
                            </div>
                          </div>
                        </div>

                        {session.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to log out of this device?')) {
                                logout();
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Log Out of This Device</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeSingle(session.id)}
                            disabled={revokingId === session.id}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {revokingId === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Revoke Device Access</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white m-0 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-600" />
                    Change Password & Purge Sessions
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                    Changing your password automatically revokes refresh tokens across all signed-in devices.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Password changed! Logged out of all devices. Please log in again.</span>
                  </div>
                )}

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Update Password & Revoke Sessions</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">
                Storage Subscription & Quota
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your current account is allocated 100 GB of CloudNest vault space.
              </p>
            </div>
          )}

          {(activeTab === 'preferences' || activeTab === 'apps' || activeTab === 'billing') && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} configuration settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
