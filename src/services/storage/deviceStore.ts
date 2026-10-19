import Storage from 'expo-sqlite/kv-store';
import { createSnapshotStore, KeyValueStore } from './snapshotStore';
import { DB_SCHEMA_VERSION } from './schemaVersion';

/** Native build: SQLite-backed key-value store. The web build uses deviceStore.web.ts. */
export const createDeviceSnapshotStore = <T>() =>
  createSnapshotStore<T>(Storage as unknown as KeyValueStore, 'batchiq.db', DB_SCHEMA_VERSION);
