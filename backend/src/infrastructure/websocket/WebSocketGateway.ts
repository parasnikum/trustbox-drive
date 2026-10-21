import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IEventBus, FileEventPayload } from '../../domain/events/EventBus';
import { InMemoryEventBus } from '../events/InMemoryEventBus';

export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  deviceId?: string;
  isAlive?: boolean;
}

export class WebSocketGateway {
  private wss: WebSocketServer | null = null;
  private clients: Set<AuthenticatedSocket> = new Set();
  private eventBus: IEventBus;

  constructor(eventBus: IEventBus = InMemoryEventBus.getInstance()) {
    this.eventBus = eventBus;
  }

  public initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (socket: AuthenticatedSocket, req) => {
      socket.isAlive = true;

      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const userId = url.searchParams.get('userId') || 'guest';
      const deviceId = url.searchParams.get('deviceId') || `device_${Date.now()}`;

      socket.userId = userId;
      socket.deviceId = deviceId;
      this.clients.add(socket);

      socket.on('error', (err) => {
        console.warn(`[WebSocketGateway] Socket error for userId ${userId}:`, err.message);
        this.clients.delete(socket);
        try {
          socket.terminate();
        } catch {

        }
      });

      socket.on('pong', () => {
        socket.isAlive = true;
      });

      socket.on('message', message => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'pong', timestamp: new Date() }), (err) => {
                if (err) this.clients.delete(socket);
              });
            }
          }
        } catch {

        }
      });

      socket.on('close', () => {
        this.clients.delete(socket);
      });
    });

    this.eventBus.subscribe((event: FileEventPayload) => {
      this.broadcastToUser(event.userId, event);
    });

    const interval = setInterval(() => {
      this.clients.forEach(socket => {
        if (socket.isAlive === false) {
          this.clients.delete(socket);
          try {
            socket.terminate();
          } catch {

          }
          return;
        }
        socket.isAlive = false;
        try {
          socket.ping();
        } catch {
          this.clients.delete(socket);
        }
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public broadcastToUser(userId: string, event: FileEventPayload): void {
    const payloadStr = JSON.stringify(event);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (client.userId === userId || userId === 'all')) {
        client.send(payloadStr, (err) => {
          if (err) {
            this.clients.delete(client);
          }
        });
      }
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
