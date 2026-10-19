import { createSnapshotStore, KeyValueStore } from '../snapshotStore';

const fakeKv = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItemSync: (k) => data.get(k) ?? null,
    setItemSync: (k, v) => void data.set(k, v),
    removeItemSync: (k) => data.delete(k),
  };
};

describe('snapshot store', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns null when nothing is saved', () => {
    expect(createSnapshotStore(fakeKv(), 'k', 1).load()).toBeNull();
  });

  it('round-trips saved data', () => {
    const kv = fakeKv();
    createSnapshotStore(kv, 'k', 1).saveNow({ a: 1 });
    expect(createSnapshotStore(kv, 'k', 1).load()).toEqual({ a: 1 });
  });

  it('ignores a snapshot from another schema version', () => {
    const kv = fakeKv();
    createSnapshotStore(kv, 'k', 1).saveNow({ a: 1 });
    expect(createSnapshotStore(kv, 'k', 2).load()).toBeNull();
  });

  it('ignores corrupt data instead of throwing', () => {
    const kv = fakeKv();
    kv.setItemSync('k', '{not json');
    expect(createSnapshotStore(kv, 'k', 1).load()).toBeNull();
  });

  it('coalesces a burst of changes into one write of the latest state', () => {
    const kv = fakeKv();
    const spy = jest.spyOn(kv, 'setItemSync');
    const store = createSnapshotStore<{ n: number }>(kv, 'k', 1, 300);
    let state = { n: 0 };
    for (let i = 1; i <= 5; i++) {
      state = { n: i };
      store.scheduleSave(() => state);
    }
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(store.load()).toEqual({ n: 5 });
  });

  it('survives a storage that throws', () => {
    const kv = fakeKv();
    kv.setItemSync = () => {
      throw new Error('disk full');
    };
    expect(() => createSnapshotStore(kv, 'k', 1).saveNow({ a: 1 })).not.toThrow();
  });
});
