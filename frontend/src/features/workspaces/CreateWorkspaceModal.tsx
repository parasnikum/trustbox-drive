import React, { useState } from 'react';
import { X, Briefcase, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export const CreateWorkspaceModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen, createWorkspace, limitInfo } = useWorkspaceStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateModalOpen) return null;

  const isLimitReached = (limitInfo?.ownedCount ?? 0) >= (limitInfo?.maxWorkspaces ?? 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await createWorkspace(name.trim(), description.trim());
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600 dark:text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Create New Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Collaborate with team members & set custom access permissions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {limitInfo && (
          <div className="mx-6 mt-4 p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>
                <strong>{limitInfo.planName} Allowance:</strong> {limitInfo.ownedCount} / {limitInfo.maxWorkspaces} Workspaces Used
              </span>
            </div>
            {isLimitReached && (
              <a
                href="/storage"
                className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-0.5 hover:underline"
              >
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Workspace Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team, Marketing Ops, Project Phoenix"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workspace's purpose..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isLimitReached || !name.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
