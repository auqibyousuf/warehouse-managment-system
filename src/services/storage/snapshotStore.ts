/**
 * BatchIQ - Snapshot persistence
 * Saves the whole database as one versioned JSON document in a key-value store.
 * The store is injected so the logic stays testable and a real backend can replace it later.
 */

export interface KeyValueStore {
  getItemSync(key: string): string | null;
  setItemSync(key: string, value: string): void;
  removeItemSync(key: string): boolean | void;
}

interface Envelope<T> {
  version: number;
  savedAt: string;
  data: T;
}

export const createSnapshotStore = <T>(
  kv: KeyValueStore,
  key: string,
  version: number,
  debounceMs = 300,
) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const writeNow = (data: T) => {
    try {
      const envelope: Envelope<T> = { version, savedAt: new Date().toISOString(), data };
      kv.setItemSync(key, JSON.stringify(envelope));
    } catch {
      // Storage unavailable or full: keep running in memory.
    }
  };

  return {
    /** Returns the saved data, or null when nothing usable is stored (missing, corrupt, other version). */
    load(): T | null {
      try {
        const raw = kv.getItemSync(key);
        if (!raw) return null;
        const envelope = JSON.parse(raw) as Envelope<T>;
        return envelope.version === version ? envelope.data : null;
      } catch {
        return null;
      }
    },

    /** Coalesces bursts of changes into one write. `read` is called when the write actually happens. */
    scheduleSave(read: () => T) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        writeNow(read());
      }, debounceMs);
    },

    saveNow(data: T) {
      if (timer) clearTimeout(timer);
      timer = null;
      writeNow(data);
    },

    clear() {
      if (timer) clearTimeout(timer);
      timer = null;
      try {
        kv.removeItemSync(key);
      } catch {
        // ignore
      }
    },
  };
};
