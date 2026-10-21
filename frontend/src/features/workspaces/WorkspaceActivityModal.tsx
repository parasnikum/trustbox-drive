import React, { useEffect, useState } from 'react';
import { X, Activity, FilePlus, FolderPlus, Trash2, Edit3, Move, Loader2, Calendar, User } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface ChangeEventItem {
  id: string;
  userId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: string;
  createdAt: string;
}

interface WorkspaceActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceActivityModal: React.FC<WorkspaceActivityModalProps> = ({ isOpen, onClose }) => {
  const { activeWorkspace } = useWorkspaceStore();
  const [events, setEvents] = useState<ChangeEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !activeWorkspace) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ events: ChangeEventItem[] }>(`/workspaces/${activeWorkspace.id}/events`);
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to fetch activity log events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isOpen, activeWorkspace]);

  if (!isOpen || !activeWorkspace) return null;

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('file.created') || eventType.includes('upload')) return <FilePlus className="w-4 h-4 text-emerald-400" />;
    if (eventType.includes('folder.created')) return <FolderPlus className="w-4 h-4 text-blue-400" />;
    if (eventType.includes('deleted') || eventType.includes('trash')) return <Trash2 className="w-4 h-4 text-rose-400" />;
    if (eventType.includes('moved')) return <Move className="w-4 h-4 text-amber-400" />;
    return <Edit3 className="w-4 h-4 text-purple-400" />;
  };

  const parsePayloadName = (payloadStr: string): string => {
    try {
      const p = JSON.parse(payloadStr);
      return p.name || p.fileName || p.title || 'Item';
    } catch {
      return 'Item';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-zinc-800 rounded-xl text-purple-600 dark:text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                Workspace Activity Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Real-time change events for {activeWorkspace.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-zinc-500">
              <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
              <span className="text-sm font-medium">Loading workspace audit events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="w-10 h-10 text-slate-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No recent activity events</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Workspace file creation, edits, and deletions will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3.5 p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800/80 rounded-2xl transition-all"
                >
                  <div className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xs shrink-0 mt-0.5">
                    {getEventIcon(ev.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {ev.eventType}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1">
                      <span className="font-semibold">{parsePayloadName(ev.payload)}</span> ({ev.entityType})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
