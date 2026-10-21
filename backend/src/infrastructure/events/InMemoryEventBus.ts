import { IEventBus, FileEventPayload, EventCallback } from '../../domain/events/EventBus';

export class InMemoryEventBus implements IEventBus {
  private static instance: InMemoryEventBus;
  private listeners: Set<EventCallback> = new Set();

  public static getInstance(): InMemoryEventBus {
    if (!InMemoryEventBus.instance) {
      InMemoryEventBus.instance = new InMemoryEventBus();
    }
    return InMemoryEventBus.instance;
  }

  async publish(event: FileEventPayload): Promise<void> {

    for (const callback of this.listeners) {
      try {
        callback(event);
      } catch (err) {
        console.error('[InMemoryEventBus] Error notifying subscriber:', err);
      }
    }
  }

  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}
