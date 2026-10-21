import { apiClient } from './apiClient';
import { FileEventPayload } from '../types';

export type SyncEventHandler = (event: FileEventPayload) => void;

export class SyncEngine {
  private static instance: SyncEngine;
  private socket: WebSocket | null = null;
  private cursor: number = 0;
  private currentUserId: string | null = null;
  private listeners: Set<SyncEventHandler> = new Set();
  private reconnectTimer: any = null;

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public connect(userId: string): void {
    if (!userId) return;

    if (this.currentUserId !== userId) {
      this.currentUserId = userId;
      const savedCursor = localStorage.getItem(`TrustBox_sync_cursor_${userId}`);
      this.cursor = savedCursor ? parseInt(savedCursor, 10) : 0;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;

    try {
      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      socket.onopen = () => {
        console.log(`⚡ [SyncEngine] WebSocket connected for user ${userId}. Fetching missed delta events...`);
        this.fetchMissedEvents();
      };

      socket.onmessage = (event) => {
        try {
          const payload: FileEventPayload = JSON.parse(event.data);
          if (payload.sequence) {
            this.updateCursor(payload.sequence);
          }
          this.notifyListeners(payload);
        } catch {

        }
      };

      socket.onclose = () => {

        if (this.socket === socket && this.currentUserId === userId) {
          console.warn('⚠️ [SyncEngine] WebSocket connection closed. Scheduling reconnect...');
          this.scheduleReconnect(userId);
        }
      };

      socket.onerror = (err) => {
        console.error('❌ [SyncEngine] WebSocket error:', err);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      const sock = this.socket;
      this.socket = null;
      sock.onclose = null;
      sock.onerror = null;
      sock.close();
    }
    this.currentUserId = null;
  }

  public async fetchMissedEvents(): Promise<void> {
    if (!this.currentUserId) return;
    try {
      const res = await apiClient.get(`/sync?cursor=${this.cursor}`);
      const { events, cursor } = res.data;
      if (events && events.length > 0) {
        console.log(`🔄 [SyncEngine] Received ${events.length} delta events from cursor ${this.cursor}`);
        events.forEach((evt: FileEventPayload) => this.notifyListeners(evt));
        this.updateCursor(cursor);
      }
    } catch (err) {
      console.error('Failed to fetch sync delta events:', err);
    }
  }

  public subscribe(handler: SyncEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(event: FileEventPayload): void {
    this.listeners.forEach((handler) => handler(event));
  }

  private updateCursor(newCursor: number): void {
    this.cursor = Math.max(this.cursor, newCursor);
    if (this.currentUserId) {
      localStorage.setItem(`TrustBox_sync_cursor_${this.currentUserId}`, this.cursor.toString());
    }
  }

  private scheduleReconnect(userId: string): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentUserId === userId) {
        this.connect(userId);
      }
    }, 5000);
  }
}
