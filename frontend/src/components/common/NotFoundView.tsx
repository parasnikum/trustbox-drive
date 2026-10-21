import React from 'react';
import { Compass, HardDrive, ArrowLeft } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface NotFoundViewProps {
  onGoHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onGoHome }) => {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const currentPath = window.location.pathname;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center select-none animate-fade-in my-auto">

      <div className="relative mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-50/80 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 flex items-center justify-center shadow-xl shadow-blue-500/5">
          <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-full shadow-md">
          404
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
        Page Not Found
      </h1>

      <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
        The path <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-lg font-mono text-xs font-semibold">{currentPath}</code> does not exist or may have been moved.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            const targetPath = activeWorkspace ? `/w/${activeWorkspace.id}/drive` : '/drive';
            window.history.pushState(null, '', targetPath);
            onGoHome();
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <HardDrive size={16} />
          <span>Back to My Drive</span>
        </button>

        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};
