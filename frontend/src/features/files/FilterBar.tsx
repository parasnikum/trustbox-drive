import React from 'react';
import {
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  FileCode,
  Calendar,
  Layers,
  XCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';

export const FilterBar: React.FC = () => {
  const {
    typeFilter,
    dateFilter,
    layoutMode,
    setTypeFilter,
    setDateFilter,
    setLayoutMode,
  } = useFileStore();

  const typeOptions = [
    { key: 'all', label: 'All Files', icon: Layers },
    { key: 'image', label: 'Images', icon: ImageIcon },
    { key: 'pdf', label: 'PDFs', icon: FileText },
    { key: 'document', label: 'Documents', icon: FileText },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'audio', label: 'Audio', icon: Music },
    { key: 'code', label: 'Code / TXT', icon: FileCode },
  ];

  const dateOptions = [
    { key: 'all', label: 'Any Time' },
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
  ];

  const hasActiveFilters = typeFilter !== 'all' || dateFilter !== 'all';

  return (
    <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">

      <div className="flex items-center gap-1.5 flex-wrap">
        {typeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = typeFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setTypeFilter(opt.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40 font-bold shadow-sm ring-1 ring-blue-500/20 dark:ring-blue-500/30'
                  : 'bg-white dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white shadow-xs'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">

        <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-xs">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setLayoutMode('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              layoutMode === 'list'
                ? 'bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 shadow-xs">
          <Calendar size={13} className="text-slate-500 dark:text-zinc-400 ml-0.5" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent border-none text-slate-800 dark:text-zinc-200 text-xs font-semibold py-1 px-1 outline-none cursor-pointer"
          >
            {dateOptions.map((opt) => (
              <option key={opt.key} value={opt.key} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setTypeFilter('all');
              setDateFilter('all');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            title="Clear all filters"
          >
            <XCircle size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
