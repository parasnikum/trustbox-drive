import { StorageManager } from '../storage/StorageManager';
import { StorageProvider } from '../../domain/storage/StorageProvider';

export class StorageRouter {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager = StorageManager.getInstance()) {
    this.storageManager = storageManager;
  }

  public selectStorageLocation(size: number, mimeType: string): { locationId: string; provider: StorageProvider } {
    const locations = this.storageManager.getAllLocations();

    const availableLocations = locations.filter(loc => loc.status === 'ONLINE' || loc.status === 'DEGRADED');

    if (availableLocations.length === 0) {

      const defaultLoc = locations.find(l => l.isDefault) || locations[0];
      return {
        locationId: defaultLoc.id,
        provider: this.storageManager.getProvider(defaultLoc.id),
      };
    }

    const hundredMB = 100 * 1024 * 1024;
    if (size > hundredMB) {
      const minioLoc = availableLocations.find(l => l.provider === 'MINIO');
      if (minioLoc) {
        return {
          locationId: minioLoc.id,
          provider: this.storageManager.getProvider(minioLoc.id),
        };
      }
    }

    if (mimeType.startsWith('video/')) {
      const mediaLoc = availableLocations.find(l => l.provider === 'MINIO');
      if (mediaLoc) {
        return {
          locationId: mediaLoc.id,
          provider: this.storageManager.getProvider(mediaLoc.id),
        };
      }
    }

    const r2Loc = availableLocations.find(l => l.provider === 'R2');
    if (r2Loc && size <= hundredMB) {
      return {
        locationId: r2Loc.id,
        provider: this.storageManager.getProvider(r2Loc.id),
      };
    }

    availableLocations.sort((a, b) => b.priority - a.priority);
    const chosen = availableLocations[0];
    return {
      locationId: chosen.id,
      provider: this.storageManager.getProvider(chosen.id),
    };
  }
}
