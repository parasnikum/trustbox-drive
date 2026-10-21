import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Download,
  Upload,
  Edit2,
  FolderInput,
  Trash2,
  Share2,
  KeyRound,
  Check,
  ChevronDown,
  Trash,
  Save,
  SlidersHorizontal,
  Info,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { WorkspaceRole, WorkspaceMember, WorkspaceABACPermissions } from '../../types';

const ROLE_PERMISSIONS_MAP: Record<
  WorkspaceRole,
  {
    label: string;
    desc: string;
    attrs: WorkspaceABACPermissions;
  }
> = {
  ADMIN: {
    label: 'Admin',
    desc: 'Full Access (Upload, Download, Edit, Move, Delete, Share, Manage Permissions)',
    attrs: {
      canDownload: true,
      canUpload: true,
      canEdit: true,
      canMove: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: true,
    },
  },
  EDITOR: {
    label: 'Editor',
    desc: 'Standard Contributor (Upload, Download, Edit, Move, Delete, Share)',
    attrs: {
      canDownload: true,
      canUpload: true,
      canEdit: true,
      canMove: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: false,
    },
  },
  VIEWER: {
    label: 'Viewer',
    desc: 'Read-only Access (Download & View Only)',
    attrs: {
      canDownload: true,
      canUpload: false,
      canEdit: false,
      canMove: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    },
  },
  CUSTOM: {
    label: 'Custom',
    desc: 'Custom Attribute-Based Overrides',
    attrs: {
      canDownload: true,
      canUpload: false,
      canEdit: false,
      canMove: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    },
  },
  OWNER: {
    label: 'Owner',
    desc: 'Workspace Ownership & Full Control',
    attrs: {
      canDownload: true,
      canUpload: true,
      canEdit: true,
      canMove: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: true,
    },
  },
};

interface LocalMemberState {
  role: WorkspaceRole;
  canDownload: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canMove: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  [key: string]: any;
}

export const WorkspaceMembersModal: React.FC = () => {
  const {
    activeWorkspace,
    isMembersModalOpen,
    setMembersModalOpen,
    activeMembers,
    membersLoading,
    addMember,
    updateMemberPermissions,
    removeMember,
  } = useWorkspaceStore();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('EDITOR');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [localMembers, setLocalMembers] = useState<Record<string, LocalMemberState>>({});
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMembers) return;
    const initialMap: Record<string, LocalMemberState> = {};
    activeMembers.forEach((m) => {
      const p = m.permissions || {
        canDownload: m.canDownload ?? false,
        canUpload: m.canUpload ?? false,
        canEdit: m.canEdit ?? false,
        canMove: m.canMove ?? false,
        canDelete: m.canDelete ?? false,
        canShare: m.canShare ?? false,
        canManagePermissions: m.canManagePermissions ?? false,
      };
      initialMap[m.id] = {
        role: m.role,
        canDownload: Boolean(p.canDownload),
        canUpload: Boolean(p.canUpload),
        canEdit: Boolean(p.canEdit),
        canMove: Boolean(p.canMove),
        canDelete: Boolean(p.canDelete),
        canShare: Boolean(p.canShare),
        canManagePermissions: Boolean(p.canManagePermissions),
      };
    });
    setLocalMembers(initialMap);
  }, [activeMembers, isMembersModalOpen]);

  if (!isMembersModalOpen || !activeWorkspace) return null;

  const canManage = activeWorkspace.isOwner || activeWorkspace.permissions?.canManagePermissions;

  const isDirty = activeMembers.some((m) => {
    const local = localMembers[m.id];
    if (!local) return false;
    const p = m.permissions || {
      canDownload: m.canDownload ?? false,
      canUpload: m.canUpload ?? false,
      canEdit: m.canEdit ?? false,
      canMove: m.canMove ?? false,
      canDelete: m.canDelete ?? false,
      canShare: m.canShare ?? false,
      canManagePermissions: m.canManagePermissions ?? false,
    };
    return (
      local.role !== m.role ||
      local.canDownload !== Boolean(p.canDownload) ||
      local.canUpload !== Boolean(p.canUpload) ||
      local.canEdit !== Boolean(p.canEdit) ||
      local.canMove !== Boolean(p.canMove) ||
      local.canDelete !== Boolean(p.canDelete) ||
      local.canShare !== Boolean(p.canShare) ||
      local.canManagePermissions !== Boolean(p.canManagePermissions)
    );
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setAdding(true);
      setError(null);
      await addMember(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setSuccessMsg(`Added ${inviteEmail.trim()} as ${inviteRole}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add workspace member.');
    } finally {
      setAdding(false);
    }
  };

  const handleLocalRoleChange = (memberId: string, newRole: WorkspaceRole) => {
    const rolePreset = ROLE_PERMISSIONS_MAP[newRole]?.attrs;
    setLocalMembers((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        role: newRole,
        ...(rolePreset || {}),
      },
    }));
  };

  const handleLocalToggleAttribute = (memberId: string, attrKey: keyof WorkspaceABACPermissions) => {
    setLocalMembers((prev) => {
      const current = prev[memberId];
      if (!current) return prev;
      const updatedValue = !current[attrKey];
      return {
        ...prev,
        [memberId]: {
          ...current,
          role: 'CUSTOM',
          [attrKey]: updatedValue,
        },
      };
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const updatePromises = activeMembers
        .filter((m) => {
          const local = localMembers[m.id];
          if (!local || m.role === 'OWNER') return false;
          const p = m.permissions || {
            canDownload: m.canDownload ?? false,
            canUpload: m.canUpload ?? false,
            canEdit: m.canEdit ?? false,
            canMove: m.canMove ?? false,
            canDelete: m.canDelete ?? false,
            canShare: m.canShare ?? false,
            canManagePermissions: m.canManagePermissions ?? false,
          };
          return (
            local.role !== m.role ||
            local.canDownload !== Boolean(p.canDownload) ||
            local.canUpload !== Boolean(p.canUpload) ||
            local.canEdit !== Boolean(p.canEdit) ||
            local.canMove !== Boolean(p.canMove) ||
            local.canDelete !== Boolean(p.canDelete) ||
            local.canShare !== Boolean(p.canShare) ||
            local.canManagePermissions !== Boolean(p.canManagePermissions)
          );
        })
        .map((m) => {
          const local = localMembers[m.id];
          return updateMemberPermissions(activeWorkspace.id, m.id, local.role, {
            canDownload: local.canDownload,
            canUpload: local.canUpload,
            canEdit: local.canEdit,
            canMove: local.canMove,
            canDelete: local.canDelete,
            canShare: local.canShare,
            canManagePermissions: local.canManagePermissions,
          });
        });

      await Promise.all(updatePromises);
      setSuccessMsg('Workspace permissions updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setManagingMemberId(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this workspace?`)) return;
    try {
      await removeMember(activeWorkspace.id, memberId);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to remove member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-zinc-800 rounded-xl text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{activeWorkspace.name}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-zinc-700">
                  {activeMembers.length} Members
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Manage Workspace Members & Attribute-Based Access Control (ABAC) Rights.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMembersModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {canManage && (
            <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-zinc-900 dark:to-zinc-800/80 border border-blue-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Add Member to Workspace
                </h3>
              </div>

              <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-6">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Member Email (e.g. user@gmail.com)"
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-4">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EDITOR">Editor - Standard Contributor</option>
                    <option value="VIEWER">Viewer - Read-only (Download & View Only)</option>
                    <option value="ADMIN">Admin - Full Administrative Access</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={adding || !inviteEmail.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{adding ? 'Adding...' : 'Add Member'}</span>
                  </button>
                </div>
              </form>

              <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-blue-200/60 dark:border-zinc-700/60 text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>Selected Role ({ROLE_PERMISSIONS_MAP[inviteRole].label}):</strong>{' '}
                  {ROLE_PERMISSIONS_MAP[inviteRole].desc}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Workspace Members List</h3>
              {isDirty && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
                  Unsaved Permission Changes Pending
                </span>
              )}
            </div>

            {membersLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading workspace members...</div>
            ) : (
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Member User</th>
                        <th className="py-3 px-4">Role Preset</th>
                        <th className="py-3 px-4">Granted Permissions Overview</th>
                        <th className="py-3 px-4 text-center">Manage ABAC</th>
                        {canManage && <th className="py-3 px-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                      {activeMembers.map((m) => {
                        const isOwner = m.role === 'OWNER';
                        const local = localMembers[m.id] || {
                          role: m.role,
                          canDownload: m.canDownload,
                          canUpload: m.canUpload,
                          canEdit: m.canEdit,
                          canMove: m.canMove,
                          canDelete: m.canDelete,
                          canShare: m.canShare,
                          canManagePermissions: m.canManagePermissions,
                        };

                        const isManagingThis = managingMemberId === m.id;

                        return (
                          <React.Fragment key={m.id}>
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                                    {m.email.substring(0, 2)}
                                  </div>
                                  <div className="truncate max-w-[200px]">
                                    <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                      {m.user?.name || m.email}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block truncate">{m.email}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {isOwner ? (
                                  <span className="text-[11px] font-extrabold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-800">
                                    OWNER
                                  </span>
                                ) : canManage ? (
                                  <select
                                    value={local.role}
                                    onChange={(e) => handleLocalRoleChange(m.id, e.target.value as WorkspaceRole)}
                                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="EDITOR">EDITOR</option>
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="CUSTOM">CUSTOM</option>
                                  </select>
                                ) : (
                                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg">
                                    {local.role}
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {local.canDownload && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200/60 dark:border-zinc-700/60">
                                      Download
                                    </span>
                                  )}
                                  {local.canUpload && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-200/60 dark:border-emerald-900/60">
                                      Upload
                                    </span>
                                  )}
                                  {local.canEdit && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200/60 dark:border-zinc-700">
                                      Edit
                                    </span>
                                  )}
                                  {local.canMove && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200/60 dark:border-amber-900/60">
                                      Move
                                    </span>
                                  )}
                                  {local.canDelete && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md border border-rose-200/60 dark:border-rose-900/60">
                                      Delete
                                    </span>
                                  )}
                                  {local.canShare && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-md border border-purple-200/60 dark:border-purple-900/60">
                                      Share
                                    </span>
                                  )}
                                  {local.canManagePermissions && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-md border border-cyan-200/60 dark:border-cyan-900/60">
                                      Manage
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  disabled={isOwner || !canManage}
                                  onClick={() => setManagingMemberId(isManagingThis ? null : m.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                                    isManagingThis
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  <span>{isManagingThis ? 'Close' : 'Manage Toggles'}</span>
                                </button>
                              </td>

                              {canManage && (
                                <td className="py-3.5 px-4 text-right">
                                  {!isOwner && (
                                    <button
                                      onClick={() => handleRemoveMember(m.id, m.email)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                                      title="Remove member"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>

                            {isManagingThis && (
                              <tr className="bg-blue-50/40 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800">
                                <td colSpan={canManage ? 5 : 4} className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                                        Granular ABAC Checkbox Toggles for {m.email}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        Toggling switches automatically updates role to CUSTOM
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white dark:bg-zinc-900 p-4 rounded-xl border border-blue-100 dark:border-zinc-800">

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canDownload}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canDownload')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Download & Preview
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canUpload}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canUpload')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Upload Files/Folders
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canEdit}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canEdit')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Edit & Rename
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canMove}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canMove')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Move Items
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canDelete}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canDelete')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Delete Items
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canShare}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canShare')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Create Share Links
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={local.canManagePermissions}
                                          onChange={() => handleLocalToggleAttribute(m.id, 'canManagePermissions')}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          Manage Permissions
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                You have unsaved permission edits. Click Save Changes below.
              </span>
            ) : (
              <span>All workspace member permissions are up to date.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMembersModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Close
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving || !isDirty}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
