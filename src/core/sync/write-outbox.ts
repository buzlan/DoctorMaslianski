export type WriteOutboxItem<T> = {
  id: string;
  authUserId: string;
  treatmentId?: string;
  createdAt: string;
  payload: T;
};

export type WriteOutboxStore<T> = {
  load(): Promise<readonly WriteOutboxItem<T>[]>;
  save(items: readonly WriteOutboxItem<T>[]): Promise<void>;
};

export type FlushItemResult = 'acked' | 'retry';

export type WriteOutbox<T> = {
  enqueue(item: WriteOutboxItem<T>): Promise<void>;
  flush(authUserId: string | null): Promise<void>;
};

function copyItem<T>(item: WriteOutboxItem<T>): WriteOutboxItem<T> {
  const copied: WriteOutboxItem<T> = {
    id: item.id,
    authUserId: item.authUserId,
    createdAt: item.createdAt,
    payload: item.payload,
  };

  if (item.treatmentId !== undefined) {
    copied.treatmentId = item.treatmentId;
  }

  return copied;
}

export function createWriteOutbox<T>(options: {
  store: WriteOutboxStore<T>;
  flushItem: (item: WriteOutboxItem<T>) => Promise<FlushItemResult>;
}): WriteOutbox<T> {
  let chain: Promise<void> = Promise.resolve();

  function enqueueOp<R>(operation: () => Promise<R>): Promise<R> {
    const run = chain.then(operation, operation);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return {
    enqueue(item) {
      return enqueueOp(async () => {
        const items = await options.store.load();
        await options.store.save([...items, copyItem(item)]);
      });
    },
    flush(authUserId) {
      return enqueueOp(async () => {
        if (authUserId === null || authUserId.length === 0) {
          return;
        }

        const items = await options.store.load();
        const remaining: WriteOutboxItem<T>[] = [];
        let stopCurrentUser = false;

        for (const item of items) {
          if (item.authUserId !== authUserId) {
            remaining.push(copyItem(item));
            continue;
          }

          if (stopCurrentUser) {
            remaining.push(copyItem(item));
            continue;
          }

          const result = await options.flushItem(item);
          if (result === 'acked') {
            continue;
          }

          remaining.push(copyItem(item));
          stopCurrentUser = true;
        }

        await options.store.save(remaining);
      });
    },
  };
}

let outboxId = 0;

export function nextOutboxItemId(now = () => Date.now()): string {
  outboxId += 1;
  return `outbox-${now()}-${outboxId}`;
}

export function resetOutboxItemIdForTests(): void {
  outboxId = 0;
}

export function createInMemoryWriteOutboxStore<T>(): WriteOutboxStore<T> & {
  items: WriteOutboxItem<T>[];
} {
  const items: WriteOutboxItem<T>[] = [];
  return {
    items,
    async load() {
      return [...items];
    },
    async save(next) {
      items.splice(0, items.length, ...next);
    },
  };
}
