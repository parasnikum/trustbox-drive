export type FileEventType =
  | 'file.created'
  | 'file.updated'
  | 'file.deleted'
  | 'file.moved'
  | 'file.renamed'
  | 'file.restored'
  | 'file.shared'
  | 'file.unshared'
  | 'folder.created'
  | 'folder.updated'
  | 'folder.deleted'
  | 'folder.moved';

export interface FileEventPayload {
  eventId: string;
  sequence: number;
  userId: string;
  eventType: FileEventType;
  entityType: 'file' | 'folder';
  entityId: string;
  payload: Record<string, any>;
  timestamp: string;
}

export type EventCallback = (event: FileEventPayload) => void;

export interface IEventBus {
  publish(event: FileEventPayload): Promise<void>;
  subscribe(callback: EventCallback): () => void;
}
