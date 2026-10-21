import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import { Workspace, WorkspaceMember, WorkspaceLimitInfo, WorkspaceRole, WorkspaceABACPermissions } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  limitInfo: WorkspaceLimitInfo | null;
  isLoading: boolean;
  isCreateModalOpen: boolean;
  isMembersModalOpen: boolean;
  activeMembers: WorkspaceMember[];
  membersLoading: boolean;

  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string, description?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  fetchMembers: (workspaceId: string) => Promise<void>;
  addMember: (
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    permissions?: Partial<WorkspaceABACPermissions>
  ) => Promise<void>;
  updateMemberPermissions: (
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
    permissions?: Partial<WorkspaceABACPermissions>
  ) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;

  setCreateModalOpen: (open: boolean) => void;
  setMembersModalOpen: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  limitInfo: null,
  isLoading: false,
  isCreateModalOpen: false,
  isMembersModalOpen: false,
  activeMembers: [],
  membersLoading: false,

  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get<{ workspaces: Workspace[]; limitInfo: WorkspaceLimitInfo }>('/workspaces');
      set({
        workspaces: res.data.workspaces,
        limitInfo: res.data.limitInfo,
      });

      const currentActive = get().activeWorkspace;
      if (currentActive) {
        const updated = res.data.workspaces.find((w) => w.id === currentActive.id);
        set({ activeWorkspace: updated || null });
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
    if (workspace) {
      get().fetchMembers(workspace.id);
    }
  },

  createWorkspace: async (name, description) => {
    const res = await apiClient.post<{ workspace: Workspace }>('/workspaces', { name, description });
    await get().fetchWorkspaces();
    get().selectWorkspace(res.data.workspace);
    set({ isCreateModalOpen: false });
    return res.data.workspace;
  },

  updateWorkspace: async (id, name, description) => {
    await apiClient.patch<{ workspace: Workspace }>(`/workspaces/${id}`, { name, description });
    await get().fetchWorkspaces();
  },

  deleteWorkspace: async (id) => {
    await apiClient.delete(`/workspaces/${id}`);
    if (get().activeWorkspace?.id === id) {
      set({ activeWorkspace: null });
    }
    await get().fetchWorkspaces();
  },

  fetchMembers: async (workspaceId) => {
    try {
      set({ membersLoading: true });
      const res = await apiClient.get<{ members: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`);
      set({ activeMembers: res.data.members });
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    } finally {
      set({ membersLoading: false });
    }
  },

  addMember: async (workspaceId, email, role, permissions) => {
    await apiClient.post(`/workspaces/${workspaceId}/members`, {
      email,
      role,
      ...permissions,
    });
    await get().fetchMembers(workspaceId);
    await get().fetchWorkspaces();
  },

  updateMemberPermissions: async (workspaceId, memberId, role, permissions) => {
    await apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}`, {
      role,
      ...permissions,
    });
    await get().fetchMembers(workspaceId);
    await get().fetchWorkspaces();
  },

  removeMember: async (workspaceId, memberId) => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    await get().fetchMembers(workspaceId);
    await get().fetchWorkspaces();
  },

  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setMembersModalOpen: (open) => set({ isMembersModalOpen: open }),
}));
