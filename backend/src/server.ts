import http from 'http';
import dotenv from 'dotenv';
import { app } from './app';
import { WebSocketGateway } from './infrastructure/websocket/WebSocketGateway';
import { TrashRetentionWorker } from './workers/trashRetentionWorker';

dotenv.config();

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

const wsGateway = new WebSocketGateway();
wsGateway.initialize(server);

TrashRetentionWorker.start();

process.on('unhandledRejection', (reason: any) => {
  console.error('[Process] Unhandled Promise Rejection:', reason?.stack || reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Process] Uncaught Exception:', err.stack || err.message || err);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TrustBox Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Gateway endpoint available at ws://localhost:${PORT}/ws`);
  console.log(`🧹 30-Day Trash Bin Retention Worker active.`);
  console.log(`=======================================================`);
});
