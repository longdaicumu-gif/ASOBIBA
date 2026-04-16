// React ↔ Phaser 間の通信用イベントバス
class EventBus {
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  on(event: string, fn: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(fn);
  }

  off(event: string, fn: (...args: unknown[]) => void) {
    const fns = this.listeners.get(event);
    if (fns) this.listeners.set(event, fns.filter(f => f !== fn));
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }
}

export const eventBus = new EventBus();
