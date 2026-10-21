import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/authRouter';
import { folderRouter } from './modules/folders/folderRouter';
import { fileRouter } from './modules/files/fileRouter';
import { uploadRouter } from './modules/uploads/uploadRouter';
import { shareRouter } from './modules/shares/shareRouter';
import { syncRouter } from './modules/sync/syncRouter';
import { storageAdminRouter } from './modules/storage/storageAdminRouter';
import { workspaceRouter } from './modules/workspaces/workspaceRouter';
import { photoRouter } from './modules/photos/photoRouter';

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRouter);
app.use('/api/folders', folderRouter);
app.use('/api/files', fileRouter);
app.use('/api/photos', photoRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/shares', shareRouter);
app.use('/api/sync', syncRouter);
app.use('/api/admin/storage', storageAdminRouter);
app.use('/api/workspaces', workspaceRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message || err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  }
});
