import { prisma } from '../infrastructure/database/prisma';
import { StorageManager } from '../infrastructure/storage/StorageManager';

const storageManager = StorageManager.getInstance();

export class TrashRetentionWorker {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly RETENTION_DAYS = 30;

  public static start(checkIntervalMs: number = 3600000): void {
    if (TrashRetentionWorker.intervalId) return;

    console.log(`🧹 [TrashRetentionWorker] Background worker initialized. Retention policy: ${TrashRetentionWorker.RETENTION_DAYS} Days.`);

    TrashRetentionWorker.purgeExpiredTrash().catch(err =>
      console.error('[TrashRetentionWorker] Purge run error:', err.message)
    );

    TrashRetentionWorker.intervalId = setInterval(() => {
      TrashRetentionWorker.purgeExpiredTrash().catch(err =>
        console.error('[TrashRetentionWorker] Purge run error:', err.message)
      );
    }, checkIntervalMs);
  }

  public static stop(): void {
    if (TrashRetentionWorker.intervalId) {
      clearInterval(TrashRetentionWorker.intervalId);
      TrashRetentionWorker.intervalId = null;
    }
  }

  public static async purgeExpiredTrash(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - TrashRetentionWorker.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const BATCH_SIZE = 50;

    while (true) {
      const expiredFiles = await prisma.files.findMany({
        where: {
          isTrash: true,
          deletedAt: { lte: thirtyDaysAgo },
        },
        include: {
          versions: {
            include: { storageObject: true },
          },
        },
        take: BATCH_SIZE,
      });

      if (expiredFiles.length === 0) {
        break;
      }

      console.log(`🧹 [TrashRetentionWorker] Purging batch of ${expiredFiles.length} expired trash file(s)...`);

      for (const file of expiredFiles) {
        try {
          for (const version of file.versions) {
            if (version.storageObject) {
              const provider = storageManager.getProvider(version.storageObject.storageLocationId);
              await provider.delete(version.storageObject.objectKey).catch(err =>
                console.error(`[TrashRetentionWorker] Error purging object ${version.storageObject.objectKey}:`, err.message)
              );
              storageManager.recordClassAOperation(version.storageObject.storageLocationId);
            }
          }

          await prisma.$transaction(async (tx) => {
            await tx.files.delete({ where: { id: file.id } });
            await tx.user.update({
              where: { id: file.ownerId },
              data: { storageUsed: { decrement: file.size } },
            }).catch(() => { });
          });
        } catch (err: any) {
          console.error(`[TrashRetentionWorker] Error purging file ${file.id}:`, err.message);
        }
      }

      if (expiredFiles.length < BATCH_SIZE) {
        break;
      }
    }
  }
}
