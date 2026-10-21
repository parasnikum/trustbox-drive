import { create } from 'zustand';
import { StorageLocation } from '../types';
import { apiClient } from '../services/apiClient';

interface StorageState {
  locations: StorageLocation[];
  isLoading: boolean;
  fetchLocations: () => Promise<void>;
  updateLocationStatus: (id: string, status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DRAINING') => Promise<void>;
}

export const useStorageStore = create<StorageState>((set) => ({
  locations: [],
  isLoading: false,

  fetchLocations: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/admin/storage/locations');
      set({ locations: res.data.locations || [], isLoading: false });
    } catch (err) {
      console.error('Error fetching storage locations:', err);
      set({ isLoading: false });
    }
  },

  updateLocationStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/admin/storage/locations/${id}/status`, { status });
      const updated = res.data.location;
      set((state) => ({
        locations: state.locations.map((loc) => (loc.id === id ? updated : loc)),
      }));
    } catch (err) {
      console.error('Error updating location status:', err);
    }
  },
}));
