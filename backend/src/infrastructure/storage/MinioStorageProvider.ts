import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  UploadInput,
  SignedUploadInput,
  SignedDownloadInput,
  SignedUrl,
  StorageMetadata,
} from '../../domain/storage/StorageProvider';

export class MinioStorageProvider extends StorageProvider {
  readonly providerName = 'MINIO';
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    bucket: string = process.env.MINIO_BUCKET || 'TrustBox-minio-primary',
    endpoint: string = process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKeyId: string = process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: string = process.env.MINIO_SECRET_KEY || 'minioadminpassword',
    region: string = process.env.MINIO_REGION || 'us-east-1'
  ) {
    super();
    this.bucket = bucket;

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(input: UploadInput): Promise<StorageMetadata> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      Body: input.content,
      ContentType: input.mimeType,
      ContentLength: input.size,
    });

    const res = await this.s3Client.send(command);
    return {
      objectKey: input.objectKey,
      size: input.size,
      etag: res.ETag,
      lastModified: new Date(),
      contentType: input.mimeType,
    };
  }

  async download(objectKey: string, range?: string): Promise<{ stream: Readable; contentLength?: number; contentRange?: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Range: range,
    });

    const res = await this.s3Client.send(command);
    return {
      stream: res.Body as Readable,
      contentLength: res.ContentLength,
      contentRange: res.ContentRange,
    };
  }

  async delete(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    await this.s3Client.send(command);
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUploadUrl(input: SignedUploadInput): Promise<SignedUrl> {
    const expiresIn = input.expiresInSeconds || 3600;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ContentType: input.mimeType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return {
      url,
      objectKey: input.objectKey,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async getSignedDownloadUrl(input: SignedDownloadInput): Promise<SignedUrl> {
    const expiresIn = input.expiresInSeconds || 3600;
    const dispType = input.disposition || 'attachment';
    const contentDisposition = input.filename ? `${dispType}; filename="${input.filename}"` : dispType;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ResponseContentDisposition: contentDisposition,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return {
      url,
      objectKey: input.objectKey,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });
    await this.s3Client.send(command);
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    await this.copy(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  async getMetadata(objectKey: string): Promise<StorageMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    const res = await this.s3Client.send(command);
    return {
      objectKey,
      size: res.ContentLength || 0,
      etag: res.ETag,
      lastModified: res.LastModified,
      contentType: res.ContentType,
    };
  }
}
