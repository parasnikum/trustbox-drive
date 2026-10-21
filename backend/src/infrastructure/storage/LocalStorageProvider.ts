import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import {
  StorageProvider,
  UploadInput,
  SignedUploadInput,
  SignedDownloadInput,
  SignedUrl,
  StorageMetadata,
} from '../../domain/storage/StorageProvider';

export class LocalStorageProvider extends StorageProvider {
  readonly providerName = 'LOCAL';
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir: string = './storage_uploads', baseUrl: string = 'http://localhost:4000') {
    super();
    this.baseDir = path.resolve(baseDir);
    this.baseUrl = baseUrl;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(objectKey: string): string {
    const sanitizedKey = objectKey.replace(/\\/g, '/');
    return path.join(this.baseDir, sanitizedKey);
  }

  async upload(input: UploadInput): Promise<StorageMetadata> {
    const targetPath = this.getFilePath(input.objectKey);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (Buffer.isBuffer(input.content)) {
      await fs.promises.writeFile(targetPath, input.content);
    } else {
      const writeStream = fs.createWriteStream(targetPath);
      input.content.pipe(writeStream);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(true));
        writeStream.on('error', reject);
      });
    }

    const stat = await fs.promises.stat(targetPath);
    return {
      objectKey: input.objectKey,
      size: stat.size,
      lastModified: stat.mtime,
      contentType: input.mimeType,
    };
  }

  async download(objectKey: string, range?: string): Promise<{ stream: Readable; contentLength?: number; contentRange?: string }> {
    const targetPath = this.getFilePath(objectKey);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File object '${objectKey}' not found in local storage`);
    }
    const stat = await fs.promises.stat(targetPath);
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const stream = fs.createReadStream(targetPath, { start, end });
      return {
        stream,
        contentLength: chunksize,
        contentRange: `bytes ${start}-${end}/${stat.size}`,
      };
    }
    return {
      stream: fs.createReadStream(targetPath),
      contentLength: stat.size,
    };
  }

  async delete(objectKey: string): Promise<void> {
    const targetPath = this.getFilePath(objectKey);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    const targetPath = this.getFilePath(objectKey);
    return fs.existsSync(targetPath);
  }

  async getSignedUploadUrl(input: SignedUploadInput): Promise<SignedUrl> {
    const expiresAt = new Date(Date.now() + (input.expiresInSeconds || 3600) * 1000);
    const url = `${this.baseUrl}/api/uploads/local-direct?key=${encodeURIComponent(input.objectKey)}`;
    return {
      url,
      objectKey: input.objectKey,
      expiresAt,
    };
  }

  async getSignedDownloadUrl(input: SignedDownloadInput): Promise<SignedUrl> {
    const expiresAt = new Date(Date.now() + (input.expiresInSeconds || 3600) * 1000);
    const dispParam = input.disposition ? `&disposition=${input.disposition}` : '';
    const fnParam = input.filename ? `&filename=${encodeURIComponent(input.filename)}` : '';
    const url = `${this.baseUrl}/api/files/download-direct?key=${encodeURIComponent(input.objectKey)}${dispParam}${fnParam}`;
    return {
      url,
      objectKey: input.objectKey,
      expiresAt,
    };
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const sourcePath = this.getFilePath(sourceKey);
    const destPath = this.getFilePath(destinationKey);
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.copyFile(sourcePath, destPath);
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    const sourcePath = this.getFilePath(sourceKey);
    const destPath = this.getFilePath(destinationKey);
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.rename(sourcePath, destPath);
  }

  async getMetadata(objectKey: string): Promise<StorageMetadata> {
    const targetPath = this.getFilePath(objectKey);
    const stat = await fs.promises.stat(targetPath);
    return {
      objectKey,
      size: stat.size,
      lastModified: stat.mtime,
    };
  }
}
