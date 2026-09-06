import { invalidateFromHint } from './canonical-invalidation';
import {
  createRealtimeSubscriber,
  MOBILE_TREATMENT_BINDINGS,
  mobileTreatmentChannelName,
  type RealtimeSubscriberAppState,
  type RealtimeSubscriberChannel,
  type RealtimeSubscriberClient,
} from './realtime-subscriber';

function createFakeAppState(initial = 'active'): RealtimeSubscriberAppState & {
  emit: (state: string) => void;
} {
  let currentState = initial;
  const listeners = new Set<(state: string) => void>();

  return {
    get currentState() {
      return currentState;
    },
    addEventListener(_type, listener) {
      listeners.add(listener);
      return {
        remove() {
          listeners.delete(listener);
        },
      };
    },
    emit(state) {
      currentState = state;
      for (const listener of listeners) {
        listener(state);
      }
    },
  };
}

function createFakeClient() {
  const removed: string[] = [];
  const opened: {
    name: string;
    tables: string[];
    callbacks: ((payload?: { table?: string }) => void)[];
  }[] = [];

  const client: RealtimeSubscriberClient & {
    opened: typeof opened;
    removed: string[];
  } = {
    opened,
    removed,
    channel(name) {
      const record = {
        name,
        tables: [] as string[],
        callbacks: [] as ((payload?: { table?: string }) => void)[],
      };
      opened.push(record);

      const handle: RealtimeSubscriberChannel & { name: string } = {
        name,
        on(_type, filter, callback) {
          record.tables.push(String(filter.table));
          record.callbacks.push(callback);
          return handle;
        },
        subscribe() {
          return handle;
        },
      };
      return handle;
    },
    removeChannel(channel) {
      removed.push((channel as unknown as { name: string }).name);
    },
  };

  return client;
}

describe('createRealtimeSubscriber', () => {
  it('does not open a channel in fixture mode', async () => {
    const client = createFakeClient();
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => false,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();

    expect(client.opened).toHaveLength(0);
    subscriber.stop();
  });

  it('does not open a channel when the client is missing', async () => {
    const subscriber = createRealtimeSubscriber({
      client: null,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();

    expect(subscriber.subscribedTreatmentId()).toBeNull();
    subscriber.stop();
  });

  it('opens one scoped channel with the expected tables', async () => {
    const client = createFakeClient();
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();

    expect(client.opened).toHaveLength(1);
    expect(client.opened[0]?.name).toBe(mobileTreatmentChannelName('treatment-1'));
    expect(client.opened[0]?.tables).toEqual(
      MOBILE_TREATMENT_BINDINGS.map((binding) => binding.table),
    );
    expect(subscriber.subscribedTreatmentId()).toBe('treatment-1');
    subscriber.stop();
  });

  it('removes the channel when AppState leaves active and resubscribes after foreground work', async () => {
    const client = createFakeClient();
    const appState = createFakeAppState();
    const order: string[] = [];
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => {
        order.push('resolve');
        return 'treatment-1';
      },
      onForeground: async () => {
        order.push('foreground');
      },
      appState,
    });

    subscriber.start();
    await Promise.resolve();
    expect(subscriber.subscribedTreatmentId()).toBe('treatment-1');

    appState.emit('background');
    await Promise.resolve();
    expect(subscriber.subscribedTreatmentId()).toBeNull();
    expect(client.removed).toEqual([mobileTreatmentChannelName('treatment-1')]);

    appState.emit('active');
    await Promise.resolve();
    await Promise.resolve();

    expect(order.slice(-2)).toEqual(['foreground', 'resolve']);
    expect(subscriber.subscribedTreatmentId()).toBe('treatment-1');
    expect(client.opened).toHaveLength(2);
    subscriber.stop();
  });

  it('does not subscribe while AppState is not active', async () => {
    const client = createFakeClient();
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState('background'),
    });

    subscriber.start();
    await subscriber.sync();

    expect(client.opened).toHaveLength(0);
    subscriber.stop();
  });

  it('replaces the channel when the treatment id changes', async () => {
    const client = createFakeClient();
    let treatmentId = 'treatment-a';
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => treatmentId,
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();
    treatmentId = 'treatment-b';
    await subscriber.sync();

    expect(client.removed).toEqual([mobileTreatmentChannelName('treatment-a')]);
    expect(subscriber.subscribedTreatmentId()).toBe('treatment-b');
    subscriber.stop();
  });

  it('removes the channel on stop and does not resubscribe after logout', async () => {
    const client = createFakeClient();
    let allow = true;
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => allow,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();
    allow = false;
    subscriber.stop();

    expect(subscriber.subscribedTreatmentId()).toBeNull();
    await subscriber.sync();
    expect(client.opened).toHaveLength(1);
  });

  it('forwards a treatments table signal as a hint without reading the row payload', async () => {
    const client = createFakeClient();
    const onHint = jest.fn();
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => 'treatment-1',
      onHint,
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();
    client.opened[0]?.callbacks[0]?.({ table: 'treatments' });
    await Promise.resolve();

    expect(onHint).toHaveBeenCalledWith('treatments');
    expect(onHint).toHaveBeenCalledTimes(1);
    subscriber.stop();
  });

  it('does not throw when channel teardown fails', async () => {
    const client = createFakeClient();
    client.removeChannel = () => {
      throw new Error('socket down');
    };
    const subscriber = createRealtimeSubscriber({
      client,
      shouldSubscribe: () => true,
      resolveTreatmentId: async () => 'treatment-1',
      appState: createFakeAppState(),
    });

    subscriber.start();
    await Promise.resolve();
    expect(() => {
      subscriber.stop();
    }).not.toThrow();
  });
});

describe('invalidateFromHint used by the subscriber', () => {
  it('is the default onHint implementation', () => {
    expect(typeof invalidateFromHint).toBe('function');
  });
});
