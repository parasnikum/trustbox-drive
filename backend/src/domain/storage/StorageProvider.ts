import { Readable } from 'stream';

export interface StorageObjectRef {
  id: string;
  storageLocationId: string;
  objectKey: string;
  size: bigint;
  checksum: string;
}

export interface UploadInput {
  objectKey: string;
  content: Buffer | Readable;
  mimeType: string;
  size: number;
}

export interface SignedUploadInput {
  objectKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}

export interface SignedDownloadInput {
  objectKey: string;
  expiresInSeconds?: number;
  filename?: string;
  disposition?: 'inline' | 'attachment';
}

export interface SignedUrl {
  url: string;
  objectKey: string;
  expiresAt: Date;
  headers?: Record<string, string>;
}

export interface StorageMetadata {
  objectKey: string;
  size: number;
  etag?: string;
  lastModified?: Date;
  contentType?: string;
}

export abstract class StorageProvider {
  abstract readonly providerName: string;

  abstract upload(input: UploadInput): Promise<StorageMetadata>;

  abstract download(objectKey: string, range?: string): Promise<{ stream: Readable; contentLength?: number; contentRange?: string }>;

  abstract delete(objectKey: string): Promise<void>;

  abstract exists(objectKey: string): Promise<boolean>;

  abstract getSignedUploadUrl(input: SignedUploadInput): Promise<SignedUrl>;

  abstract getSignedDownloadUrl(input: SignedDownloadInput): Promise<SignedUrl>;

  abstract copy(sourceKey: string, destinationKey: string): Promise<void>;

  abstract move(sourceKey: string, destinationKey: string): Promise<void>;

  abstract getMetadata(objectKey: string): Promise<StorageMetadata>;
}
