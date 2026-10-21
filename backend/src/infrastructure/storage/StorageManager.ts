import { StorageProvider } from '../../domain/storage/StorageProvider';
import { R2StorageProvider } from './R2StorageProvider';
import { MinioStorageProvider } from './MinioStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { prisma } from '../database/prisma';

export interface LocationRegistration {
  id: string;
  name: string;
  provider: 'R2' | 'MINIO' | 'S3';
  endpoint?: string;
  bucket?: string;
  region?: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DRAINING';
  capacity: bigint;
  used: bigint;
  priority: number;
  isDefault: boolean;
  classAOps?: bigint;
  classBOps?: bigint;
}

export class StorageManager {
  private static instance: StorageManager;
  private providers: Map<string, StorageProvider> = new Map();
  private locations: Map<string, LocationRegistration> = new Map();

  private constructor() {
    this.registerLocation({
      id: 'r2-primary',
      name: 'Cloudflare R2 Primary',
      provider: 'R2',
      endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : 'https://r2.cloudflarestorage.com',
      bucket: process.env.R2_BUCKET || 'TrustBox-r2-primary',
      status: 'ONLINE',
      capacity: BigInt(536870912000),
      used: BigInt(1289382),
      priority: 1,
      isDefault: true,
    });

    this.registerLocation({
      id: 'minio-home',
      name: 'Self-Hosted MinIO Server',
      provider: 'MINIO',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      bucket: process.env.MINIO_BUCKET || 'TrustBox-minio-primary',
      status: 'ONLINE',
      capacity: BigInt(1073741824000),
      used: BigInt(4918230),
      priority: 2,
      isDefault: false,
    });

    this.registerLocation({
      id: 'aws-s3-main',
      name: 'Amazon S3 Standard',
      provider: 'S3',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'TrustBox-aws-s3',
      status: 'ONLINE',
      capacity: BigInt(2147483648000),
      used: BigInt(0),
      priority: 3,
      isDefault: false,
    });

    this.syncDatabaseLocations().catch(e => console.error('[StorageManager] DB seed error:', e.message));
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public async syncDatabaseLocations(): Promise<void> {
    for (const loc of this.locations.values()) {
      try {
        await prisma.storageLocations.upsert({
          where: { id: loc.id },
          update: {
            name: loc.name,
            provider: loc.provider,
            endpoint: loc.endpoint || null,
            bucket: loc.bucket || null,
            region: loc.region || null,
            status: loc.status,
            capacity: loc.capacity,
            priority: loc.priority,
            isDefault: loc.isDefault,
          },
          create: {
            id: loc.id,
            name: loc.name,
            provider: loc.provider,
            endpoint: loc.endpoint || null,
            bucket: loc.bucket || null,
            region: loc.region || null,
            status: loc.status,
            capacity: loc.capacity,
            used: loc.used,
            priority: loc.priority,
            isDefault: loc.isDefault,
          },
        });
      } catch (err: any) {
        console.warn(`[StorageManager] Warning seeding location ${loc.id}:`, err.message);
      }
    }
  }

  public async recordClassAOperation(locationId: string): Promise<void> {
    prisma.storageLocations.update({
      where: { id: locationId },
      data: { classAOps: { increment: 1 } },
    }).catch(() => { });
  }

  public async recordClassBOperation(locationId: string): Promise<void> {
    prisma.storageLocations.update({
      where: { id: locationId },
      data: { classBOps: { increment: 1 } },
    }).catch(() => { });
  }

  public registerLocation(location: LocationRegistration): void {
    this.locations.set(location.id, location);

    let provider: StorageProvider;
    switch (location.provider) {
      case 'R2':
        provider = new R2StorageProvider(location.bucket);
        break;
      case 'MINIO':
        provider = new MinioStorageProvider(location.bucket, location.endpoint);
        break;
      case 'S3':
      default:
        provider = new S3StorageProvider(location.bucket, location.region);
        break;
    }

    this.providers.set(location.id, provider);
  }

  public getProvider(locationId: string): StorageProvider {
    const provider = this.providers.get(locationId);
    if (!provider) {
      return this.providers.get('r2-primary') || new R2StorageProvider();
    }
    return provider;
  }

  public getLocation(locationId: string): LocationRegistration | undefined {
    return this.locations.get(locationId);
  }

  public getAllLocations(): LocationRegistration[] {
    return Array.from(this.locations.values());
  }

  public setLocationStatus(locationId: string, status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DRAINING'): void {
    const loc = this.locations.get(locationId);
    if (loc) {
      loc.status = status;
      this.locations.set(locationId, loc);
      prisma.storageLocations.update({ where: { id: locationId }, data: { status } }).catch(() => { });
    }
  }

  public async getOrGeneratePresignedDownloadUrl(
    storageObjectId: string,
    filename?: string,
    isInline: boolean = false,
    expiresInSeconds: number = 604800
  ): Promise<{ url: string; isCached: boolean; expiresAt: Date }> {
    const storageObj = await prisma.storageObjects.findUnique({
      where: { id: storageObjectId },
    });

    if (!storageObj) {
      throw new Error('Storage object metadata not found');
    }

    const now = new Date();
    const FIVE_MINUTES_BUFFER_MS = 5 * 60 * 1000;

    if (
      storageObj.cachedDownloadUrl &&
      storageObj.downloadUrlExpiresAt &&
      storageObj.downloadUrlExpiresAt.getTime() - now.getTime() > FIVE_MINUTES_BUFFER_MS
    ) {
      return {
        url: storageObj.cachedDownloadUrl,
        isCached: true,
        expiresAt: storageObj.downloadUrlExpiresAt,
      };
    }

    const provider = this.getProvider(storageObj.storageLocationId);
    const disposition = isInline ? 'inline' : 'attachment';

    const signedResult = await provider.getSignedDownloadUrl({
      objectKey: storageObj.objectKey,
      expiresInSeconds,
      filename: filename || storageObj.objectKey.split('/').pop(),
      disposition,
    });

    await prisma.storageObjects.update({
      where: { id: storageObj.id },
      data: {
        cachedDownloadUrl: signedResult.url,
        downloadUrlExpiresAt: signedResult.expiresAt,
      },
    });

    this.recordClassBOperation(storageObj.storageLocationId);

    return {
      url: signedResult.url,
      isCached: false,
      expiresAt: signedResult.expiresAt,
    };
  }
}
