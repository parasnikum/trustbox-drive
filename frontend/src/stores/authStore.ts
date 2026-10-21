import { create } from 'zustand';
import { User } from '../types';
import { apiClient, ensureFreshToken } from '../services/apiClient';

export interface ActiveSession {
  id: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  activeSessions: ActiveSession[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('trustBox_token'),
  activeSessions: [],
  isAuthenticated: !!localStorage.getItem('trustBox_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data;
      if (accessToken) {
        localStorage.setItem('trustBox_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('TrustBox_refresh_token', refreshToken);
      }
      set({ user, token: accessToken || 'cookie-session', isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/register', { email, password, name });
      const { user, accessToken, refreshToken } = res.data;
      if (accessToken) {
        localStorage.setItem('trustBox_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('TrustBox_refresh_token', refreshToken);
      }
      set({ user, token: accessToken || 'cookie-session', isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {

      const freshToken = await ensureFreshToken();
      const res = await apiClient.get('/auth/me');
      set({
        user: res.data.user,
        token: freshToken || localStorage.getItem('trustBox_token') || 'cookie-session',
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      localStorage.removeItem('trustBox_token');
      localStorage.removeItem('TrustBox_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchActiveSessions: async () => {
    try {
      const res = await apiClient.get('/auth/sessions');
      set({ activeSessions: res.data.sessions || [] });
    } catch (err: any) {
      console.error('Error fetching active sessions:', err);
    }
  },

  revokeSession: async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      set((state) => ({
        activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to revoke session');
    }
  },

  revokeAllOtherSessions: async () => {
    try {
      await apiClient.delete('/auth/sessions/other/all');
      set((state) => ({
        activeSessions: state.activeSessions.filter((s) => s.isCurrent),
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to revoke other sessions');
    }
  },

  updateProfile: async (name, email) => {
    try {
      const res = await apiClient.patch('/auth/profile', { name, email });
      set({ user: res.data.user });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Profile update failed');
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      localStorage.removeItem('trustBox_token');
      localStorage.removeItem('TrustBox_refresh_token');
      set({ user: null, token: null, isAuthenticated: false });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Password change failed');
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return res.data.resetToken || '';
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Password reset request failed');
    }
  },

  resetPassword: async (resetToken, newPassword) => {
    try {
      await apiClient.post('/auth/reset-password', { resetToken, newPassword });
      localStorage.removeItem('trustBox_token');
      localStorage.removeItem('TrustBox_refresh_token');
      set({ user: null, token: null, isAuthenticated: false });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Password reset failed');
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('TrustBox_refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (e) {

    } finally {
      localStorage.removeItem('trustBox_token');
      localStorage.removeItem('TrustBox_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, activeSessions: [] });
    }
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('TrustBox:token-refreshed', (event: any) => {
    const { accessToken, user } = event.detail || {};
    if (accessToken) {
      useAuthStore.setState((prev) => ({
        token: accessToken,
        user: user || prev.user,
        isAuthenticated: true,
      }));
    }
  });

  window.addEventListener('TrustBox:auth-expired', () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      activeSessions: [],
    });
  });
}
