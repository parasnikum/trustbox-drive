import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const getInitialCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('cloudnest_sidebar_collapsed');
  return saved === 'true';
};

export const useSidebarStore = create<SidebarState>((set, get) => ({
  isCollapsed: getInitialCollapsed(),
  toggleSidebar: () => {
    const nextState = !get().isCollapsed;
    localStorage.setItem('cloudnest_sidebar_collapsed', String(nextState));
    set({ isCollapsed: nextState });
  },
  setCollapsed: (collapsed: boolean) => {
    localStorage.setItem('cloudnest_sidebar_collapsed', String(collapsed));
    set({ isCollapsed: collapsed });
  },
}));
