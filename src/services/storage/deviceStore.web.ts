import { createSnapshotStore, KeyValueStore } from './snapshotStore';
import { DB_SCHEMA_VERSION } from './schemaVersion';

/**
 * Web build: expo-sqlite's synchronous key-value API is not available in the browser,
 * so the snapshot lives in localStorage (also keeps the WebAssembly runtime out of the bundle).
 */
const browserStorage: KeyValueStore = {
  getItemSync: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItemSync: (key, value) => {
    window.localStorage.setItem(key, value);
  },
  removeItemSync: (key) => {
    window.localStorage.removeItem(key);
  },
};

export const createDeviceSnapshotStore = <T>() =>
  createSnapshotStore<T>(browserStorage, 'batchiq.db', DB_SCHEMA_VERSION);
