import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  Check,
  Zap,
  RefreshCw,
  Plus,
  Minus,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../services/apiClient';

interface CategoryAnalytic {
  id: string;
  name: string;
  bytes: string;
  displaySize: string;
  gb: string;
  percentage: number;
  color: string;
  textColor: string;
  borderColor: string;
}

interface AnalyticsData {
  storageQuota: string;
  storageUsed: string;
  availableBytes: string;
  usedGB: string;
  quotaGB: string;
  availableGB: string;
  usedDisplay: string;
  quotaDisplay: string;
  availableDisplay: string;
  percentage: number;
  totalFileCount: number;
  isCached: boolean;
  lastCalculated?: string;
  categories: CategoryAnalytic[];
}

export const StorageUsageView: React.FC = () => {
  const { user, fetchCurrentUser } = useAuthStore();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [customBoostGB, setCustomBoostGB] = useState<number | string>(5);
  const [upgrading, setUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAnalytics = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get<AnalyticsData>(
        `/files/storage/analytics${forceRefresh ? '?forceRefresh=true' : ''}`
      );
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch storage analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  const handleManualRefresh = () => {
    if (refreshCooldown > 0 || refreshing) return;
    setRefreshCooldown(5);
    fetchAnalytics(true);
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      setUpgrading(true);
      await apiClient.post('/files/storage/upgrade', { planId });
      await fetchCurrentUser();
      await fetchAnalytics(true);
      setSuccessMessage(`Plan updated successfully! Your storage quota is now updated.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update plan.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleAddStorageBoost = async () => {
    const val = typeof customBoostGB === 'number' ? customBoostGB : parseInt(customBoostGB as string, 10);
    if (isNaN(val) || val < 5) {
      alert('Minimum storage boost size starting at 5 GB.');
      return;
    }

    try {
      setUpgrading(true);
      await apiClient.post('/files/storage/upgrade', { addGB: val });
      await fetchCurrentUser();
      await fetchAnalytics(true);
      setSuccessMessage(`Added +${val} GB Extra Storage Boost to your account!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to add storage boost.');
    } finally {
      setUpgrading(false);
    }
  };

  const userQuotaBytes = BigInt(user?.storageQuota || '2147483648');
  const userQuotaGB = Number(userQuotaBytes) / (1024 * 1024 * 1024);
  const isFreePlan = userQuotaGB <= 2.1;
  const isStarterPlan = Math.abs(userQuotaGB - 100) < 5;
  const isProPlan = userQuotaGB >= 900;

  const strokeDasharray = 2 * Math.PI * 70;
  const percentage = analytics?.percentage || 0;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  const categoryIconMap: Record<string, React.ReactNode> = {
    documents: <FileText className="w-5 h-5 text-amber-500" />,
    photos: <ImageIcon className="w-5 h-5 text-emerald-500" />,
    videos: <Video className="w-5 h-5 text-blue-500" />,
    other: <Archive className="w-5 h-5 text-purple-500" />,
  };

  const currentBoostVal = typeof customBoostGB === 'number' ? customBoostGB : (parseInt(customBoostGB as string, 10) || 5);

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-xs">
                <HardDrive className="w-6 h-6 stroke-blue-600 dark:stroke-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-display">Know where your space goes</h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  See how you're using your space across media, documents, and projects.
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Button & Cache Status */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {analytics?.lastCalculated && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {analytics.isCached ? 'Cached (Auto-refreshed)' : 'Live Updated'}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshCooldown > 0 || refreshing}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-2xl transition-all shadow-xs cursor-pointer ${refreshCooldown > 0 || refreshing
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700 cursor-not-allowed'
                : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800'
                }`}
              title={refreshCooldown > 0 ? `Rate limit cooldown: wait ${refreshCooldown}s` : 'Refresh analytics'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              <span>
                {refreshing
                  ? 'Updating...'
                  : refreshCooldown > 0
                    ? `Cooldown (${refreshCooldown}s)`
                    : 'Refresh Storage'}
              </span>
            </button>
          </div>
        </div>

        {/* Success Notification Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center justify-between animate-fade-in text-xs font-semibold">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Main Grid: Storage Gauge & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage Circular Gauge Card */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Overall Storage</h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-900/40">
                  {userQuotaGB.toFixed(1)} GB Quota
                </span>
              </div>

              {/* Circular SVG Meter */}
              <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-slate-200 dark:stroke-zinc-800"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-1000 ease-out"
                    strokeWidth="14"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                    {percentage}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Used</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-sm">
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-500 dark:text-zinc-400">Total Used:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {analytics?.usedDisplay || '0.0 B'} ({analytics?.usedGB || '0.00'} GB)
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-500 dark:text-zinc-400">Available:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {analytics?.availableDisplay || '0.0 B'} ({analytics?.availableGB || '0.00'} GB)
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-500 dark:text-zinc-400">Files Tracked:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {analytics?.totalFileCount ?? 0} files
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table / Grid */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Category Breakdown</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Calculated automatically across all stored files.
                  </p>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  4 Categories
                </span>
              </div>

              <div className="space-y-4">
                {analytics?.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-zinc-200/60 dark:border-zinc-700/60">
                          {categoryIconMap[cat.id] || <FileText className="w-5 h-5 text-zinc-400" />}
                        </div>
                        <div>
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</span>
                          <div className="text-xs text-zinc-400">{cat.displaySize} ({cat.gb} GB)</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{cat.percentage}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans & Quota Limits Section */}
        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Subscription Plans</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Default plan starts at 2 GB per user. Upgrade to higher tiers anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1: Default Free Plan (2 GB) */}
            <div
              className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm relative flex flex-col justify-between transition-all ${isFreePlan
                ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
                }`}
            >
              {isFreePlan && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  CURRENT PLAN
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free Plan</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">
                    2 GB / User
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">$0</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400"> / forever</span>
                </div>

                <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Default 2 GB storage limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Standard upload speed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Public & Private link sharing</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleUpgradePlan('free')}
                disabled={isFreePlan || upgrading}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${isFreePlan
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                  }`}
              >
                {isFreePlan ? 'Active Free Plan' : 'Switch to Free (2 GB)'}
              </button>
            </div>

            {/* Plan 2: Starter Plan (100 GB) */}
            <div
              className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm relative flex flex-col justify-between transition-all ${isStarterPlan
                ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
                }`}
            >
              {isStarterPlan && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  CURRENT PLAN
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Starter Tier</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    100 GB
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Tier Plan</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Custom per-GB pricing set later</span>
                </div>

                <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100 GB High-Speed Quota</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Realtime storage analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Enhanced bandwidth limit</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleUpgradePlan('starter')}
                disabled={isStarterPlan || upgrading}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${isStarterPlan
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
              >
                {isStarterPlan ? 'Active Starter Plan' : 'Select Starter (100 GB)'}
              </button>
            </div>

            {/* Plan 3: Pro Plan (1 TB) */}
            <div
              className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm relative flex flex-col justify-between transition-all ${isProPlan
                ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
                }`}
            >
              {isProPlan && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  CURRENT PLAN
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pro Tier</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 rounded-lg">
                    1 TB (1000 GB)
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Pro Plan</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Custom per-GB pricing set later</span>
                </div>

                <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>1000 GB (1 TB) Cloud Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited file versioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Priority API & CDN access</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleUpgradePlan('pro')}
                disabled={isProPlan || upgrading}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${isProPlan
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  }`}
              >
                {isProPlan ? 'Active Pro Plan' : 'Select Pro Plan (1 TB)'}
              </button>
            </div>
          </div>
        </div>

        {/* Extra Storage Boost Section (Manually Typeable Box) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-zinc-900 dark:to-zinc-900/80 border border-blue-200/80 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Extra Storage Boost</h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                Type any custom size directly into the box below (e.g. 5, 25, 50, 75, 100 GB). Starting minimum limit is <strong>5 GB</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-zinc-700">
              <span>Min Starting Size: 5 GB</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Quick Shortcuts */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Quick Shortcuts
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[5, 25, 50, 75, 100].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => setCustomBoostGB(gb)}
                    className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-all ${currentBoostVal === gb
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400'
                      }`}
                  >
                    +{gb} GB
                  </button>
                ))}
              </div>
            </div>

            {/* Manually Typeable Stepper Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const val = typeof customBoostGB === 'number' ? customBoostGB : parseInt(customBoostGB as string, 10) || 5;
                    setCustomBoostGB(Math.max(5, val - 1));
                  }}
                  disabled={currentBoostVal <= 5}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Decrease storage"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center px-2 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-1 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-zinc-700/60 focus-within:ring-2 focus-within:ring-blue-500">

                    <input
                      type="number"
                      min="5"
                      value={customBoostGB}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomBoostGB(v === '' ? '' : parseInt(v, 10));
                      }}
                      className="w-20 text-center bg-transparent font-extrabold text-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">GB</span>
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Extra Space (Type Any GB)</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const val = typeof customBoostGB === 'number' ? customBoostGB : parseInt(customBoostGB as string, 10) || 5;
                    setCustomBoostGB(val + 1);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  title="Increase storage"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddStorageBoost}
                disabled={upgrading || currentBoostVal < 5}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add +{currentBoostVal || 5} GB Boost</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
