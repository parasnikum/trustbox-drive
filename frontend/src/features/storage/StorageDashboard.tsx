import React, { useEffect } from 'react';
import { HardDrive, Server, Cloud, Database, ShieldAlert, Activity, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';

export const StorageDashboard: React.FC = () => {
  const { locations, isLoading, fetchLocations, updateLocationStatus } = useStorageStore();

  useEffect(() => {
    fetchLocations();
  }, []);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'R2':
        return <Cloud size={24} color="#818cf8" />;
      case 'MINIO':
        return <Server size={24} color="#34d399" />;
      case 'LOCAL':
      default:
        return <Database size={24} color="#fde68a" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <span className="badge badge-emerald">ONLINE</span>;
      case 'DEGRADED':
        return <span className="badge badge-amber">DEGRADED</span>;
      case 'DRAINING':
        return <span className="badge badge-amber">DRAINING</span>;
      case 'OFFLINE':
      default:
        return <span className="badge badge-rose">OFFLINE</span>;
    }
  };

  const formatStorage = (bytesStr: string) => {
    const bytes = Number(bytesStr);
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1000) {
      return `${(gb / 1024).toFixed(1)} TB`;
    }
    return `${gb.toFixed(0)} GB`;
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <HardDrive size={26} className="text-blue-600 dark:text-blue-400" />
            <span>Storage Location Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Storage Abstraction Layer — Dynamic Policy Routing & Provider Health Engine
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Active Providers</span>
              <Activity size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">{locations.length}</div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">R2, MinIO, & Local Disk</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Routing Strategy</span>
              <ArrowRightLeft size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">Dynamic Policy</div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">Size & Health Thresholds</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">System Health</span>
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% Operational</div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">All storage layers reachable</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
            Registered Storage Destinations ({locations.length})
          </h3>

          <div className="space-y-4">
            {locations.map((loc) => {
              const usedBytes = Number(loc.used);
              const capacityBytes = Number(loc.capacity);
              const percent = capacityBytes > 0 ? Math.round((usedBytes / capacityBytes) * 100) : 0;

              return (
                <div key={loc.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-4">

                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-center shrink-0">
                        {getProviderIcon(loc.provider)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{loc.name}</h4>
                          {getStatusBadge(loc.status)}
                          {loc.isDefault && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          Provider: <code className="text-blue-600 dark:text-blue-400">{loc.provider}</code> • Bucket: <code className="text-blue-600 dark:text-blue-400">{loc.bucket || 'local-dir'}</code> • Priority: {loc.priority}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-zinc-400">State:</span>
                      <select
                        value={loc.status}
                        onChange={(e) => updateLocationStatus(loc.id, e.target.value as any)}
                        className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                      >
                        <option value="ONLINE">ONLINE</option>
                        <option value="DEGRADED">DEGRADED</option>
                        <option value="DRAINING">DRAINING</option>
                        <option value="OFFLINE">OFFLINE</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1.5">
                      <span>Capacity Allocation ({percent}% Used)</span>
                      <span className="font-mono">{formatStorage(loc.used)} / {formatStorage(loc.capacity)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: loc.status === 'DRAINING' ? '#f59e0b' : '#2563eb',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
