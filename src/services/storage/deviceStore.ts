import Storage from 'expo-sqlite/kv-store';
import { createSnapshotStore, KeyValueStore } from './snapshotStore';

/** Bump when the stored database shape changes incompatibly; old snapshots are then ignored. */
export const DB_SCHEMA_VERSION = 1;

export const createDeviceSnapshotStore = <T>() =>
  createSnapshotStore<T>(Storage as unknown as KeyValueStore, 'batchiq.db', DB_SCHEMA_VERSION);
