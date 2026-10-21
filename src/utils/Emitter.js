/** Minimal event emitter. `on` returns an unsubscribe function. */
export class Emitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(listener);
    return () => this.#listeners.get(event)?.delete(listener);
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach((listener) => listener(...args));
  }
}
