import { createWriteOutbox, type WriteOutboxItem } from './write-outbox';

describe('createWriteOutbox', () => {
  it('flushes only the current auth user and preserves FIFO for that user', async () => {
    const storeItems: WriteOutboxItem<string>[] = [];
    const flushed: string[] = [];

    const outbox = createWriteOutbox({
      store: {
        async load() {
          return [...storeItems];
        },
        async save(items) {
          storeItems.splice(0, storeItems.length, ...items);
        },
      },
      async flushItem(item) {
        flushed.push(`${item.authUserId}:${item.payload}`);
        return 'acked';
      },
    });

    await outbox.enqueue({
      id: '1',
      authUserId: 'user-a',
      createdAt: '2026-09-04T10:00:00.000Z',
      payload: 'complete',
    });
    await outbox.enqueue({
      id: '2',
      authUserId: 'user-b',
      createdAt: '2026-09-04T10:00:01.000Z',
      payload: 'other',
    });
    await outbox.enqueue({
      id: '3',
      authUserId: 'user-a',
      createdAt: '2026-09-04T10:00:02.000Z',
      payload: 'uncomplete',
    });

    await outbox.flush('user-a');

    expect(flushed).toEqual(['user-a:complete', 'user-a:uncomplete']);
    expect(storeItems.map((item) => item.id)).toEqual(['2']);
  });

  it('stops later items for the same user after a retryable failure', async () => {
    const storeItems: WriteOutboxItem<string>[] = [];
    const flushed: string[] = [];

    const outbox = createWriteOutbox({
      store: {
        async load() {
          return [...storeItems];
        },
        async save(items) {
          storeItems.splice(0, storeItems.length, ...items);
        },
      },
      async flushItem(item) {
        flushed.push(item.payload);
        return item.payload === 'complete' ? 'retry' : 'acked';
      },
    });

    await outbox.enqueue({
      id: '1',
      authUserId: 'user-a',
      createdAt: 'a',
      payload: 'complete',
    });
    await outbox.enqueue({
      id: '2',
      authUserId: 'user-a',
      createdAt: 'b',
      payload: 'uncomplete',
    });

    await outbox.flush('user-a');

    expect(flushed).toEqual(['complete']);
    expect(storeItems.map((item) => item.payload)).toEqual(['complete', 'uncomplete']);
  });

  it('does not flush when authUserId is null', async () => {
    const storeItems: WriteOutboxItem<string>[] = [
      {
        id: '1',
        authUserId: 'user-a',
        createdAt: 'a',
        payload: 'complete',
      },
    ];
    let flushed = false;

    const outbox = createWriteOutbox({
      store: {
        async load() {
          return [...storeItems];
        },
        async save(items) {
          storeItems.splice(0, storeItems.length, ...items);
        },
      },
      async flushItem() {
        flushed = true;
        return 'acked';
      },
    });

    await outbox.flush(null);

    expect(flushed).toBe(false);
    expect(storeItems).toHaveLength(1);
  });

  it('serializes concurrent flush calls (single-flight)', async () => {
    const storeItems: WriteOutboxItem<string>[] = [];
    let inFlight = 0;
    let maxInFlight = 0;

    const outbox = createWriteOutbox({
      store: {
        async load() {
          return [...storeItems];
        },
        async save(items) {
          storeItems.splice(0, storeItems.length, ...items);
        },
      },
      async flushItem() {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return 'acked';
      },
    });

    await outbox.enqueue({
      id: '1',
      authUserId: 'user-a',
      createdAt: 'a',
      payload: 'complete',
    });

    await Promise.all([outbox.flush('user-a'), outbox.flush('user-a')]);

    expect(maxInFlight).toBe(1);
  });
});
