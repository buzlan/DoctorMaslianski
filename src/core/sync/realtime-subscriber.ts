import {
  invalidateFromHint,
  isInvalidationHint,
  type InvalidationHint,
} from './canonical-invalidation';

export type RealtimeSubscriberAppState = {
  currentState: string;
  addEventListener: (
    type: 'change',
    listener: (state: string) => void,
  ) => { remove: () => void };
};

export type RealtimeSubscriberChannel = {
  on: (
    type: string,
    filter: Record<string, unknown>,
    callback: (payload?: { table?: string }) => void,
  ) => RealtimeSubscriberChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeSubscriberChannel;
};

export type RealtimeSubscriberClient = {
  channel: (name: string) => RealtimeSubscriberChannel;
  removeChannel: (channel: RealtimeSubscriberChannel) => Promise<unknown> | unknown;
};

export const MOBILE_TREATMENT_BINDINGS = [
  { table: 'treatments', event: 'UPDATE', column: 'id' },
  { table: 'treatment_periods', event: '*', column: 'treatment_id' },
  { table: 'action_assignments', event: '*', column: 'treatment_id' },
  { table: 'appointments', event: '*', column: 'treatment_id' },
  { table: 'treatment_milestones', event: 'INSERT', column: 'treatment_id' },
  { table: 'doctor_milestone_photos', event: 'INSERT', column: 'treatment_id' },
] as const;

export function mobileTreatmentChannelName(treatmentId: string): string {
  return `mobile:treatment:${treatmentId}`;
}

export type CreateRealtimeSubscriberOptions = {
  client: RealtimeSubscriberClient | null;
  shouldSubscribe: () => boolean;
  resolveTreatmentId: () => Promise<string | null>;
  onHint?: (hint: InvalidationHint) => void;
  onForeground?: () => void | Promise<void>;
  appState: RealtimeSubscriberAppState;
};

export type RealtimeSubscriber = {
  start: () => void;
  stop: () => void;
  sync: () => Promise<void>;
  subscribedTreatmentId: () => string | null;
};

export function createRealtimeSubscriber(
  options: CreateRealtimeSubscriberOptions,
): RealtimeSubscriber {
  let channel: RealtimeSubscriberChannel | null = null;
  let treatmentId: string | null = null;
  let epoch = 0;
  let appStateSubscription: { remove: () => void } | null = null;

  function removeChannelOnly(): void {
    if (channel === null || options.client === null) {
      channel = null;
      return;
    }

    const current = channel;
    channel = null;
    try {
      void options.client.removeChannel(current);
    } catch {
      // Channel teardown must not break the open app.
    }
  }

  function openChannel(nextTreatmentId: string): void {
    const client = options.client;
    if (client === null) {
      return;
    }

    let next = client.channel(mobileTreatmentChannelName(nextTreatmentId));
    for (const binding of MOBILE_TREATMENT_BINDINGS) {
      next = next.on(
        'postgres_changes',
        {
          event: binding.event,
          schema: 'public',
          table: binding.table,
          filter: `${binding.column}=eq.${nextTreatmentId}`,
        },
        (payload) => {
          const table = payload?.table ?? binding.table;
          if (!isInvalidationHint(table)) {
            return;
          }

          (options.onHint ?? invalidateFromHint)(table);
          if (table === 'treatments') {
            void sync();
          }
        },
      );
    }

    next.subscribe();
    channel = next;
    treatmentId = nextTreatmentId;
  }

  async function sync(): Promise<void> {
    const token = epoch;

    if (options.client === null || !options.shouldSubscribe()) {
      removeChannelOnly();
      treatmentId = null;
      return;
    }

    if (options.appState.currentState !== 'active') {
      removeChannelOnly();
      return;
    }

    let nextId: string | null;
    try {
      nextId = await options.resolveTreatmentId();
    } catch {
      return;
    }

    if (token !== epoch) {
      return;
    }

    if (options.client === null || !options.shouldSubscribe() || options.appState.currentState !== 'active') {
      removeChannelOnly();
      if (!options.shouldSubscribe()) {
        treatmentId = null;
      }
      return;
    }

    if (nextId === null) {
      removeChannelOnly();
      treatmentId = null;
      return;
    }

    if (channel !== null && treatmentId === nextId) {
      return;
    }

    removeChannelOnly();
    openChannel(nextId);
  }

  async function onAppState(state: string): Promise<void> {
    epoch += 1;
    const token = epoch;

    if (state !== 'active') {
      removeChannelOnly();
      return;
    }

    try {
      await options.onForeground?.();
    } catch {
      // Foreground refetch failure must not block resubscribe.
    }

    if (token !== epoch) {
      return;
    }

    await sync();
  }

  return {
    start() {
      if (appStateSubscription !== null) {
        return;
      }

      appStateSubscription = options.appState.addEventListener('change', (state) => {
        void onAppState(state);
      });

      if (options.appState.currentState === 'active') {
        void sync();
      }
    },
    stop() {
      epoch += 1;
      appStateSubscription?.remove();
      appStateSubscription = null;
      removeChannelOnly();
      treatmentId = null;
    },
    sync,
    subscribedTreatmentId() {
      return channel === null ? null : treatmentId;
    },
  };
}
