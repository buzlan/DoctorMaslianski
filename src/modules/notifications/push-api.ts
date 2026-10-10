import { getSharedRemotePatientContextResolver } from '@/core/auth/shared-remote-patient-context';
import { getSharedSupabaseClient, type AppSupabaseClient } from '@/core/supabase/client';

import { disablePushSubscription, readVapidPublicKey, subscriptionKeys, syncPushSubscription, vapidPublicKeyToBytes, type PushKeys } from './reminders';

type PushWrite = {
  upsert(
    values: PushKeys & { patient_id: string; last_seen_at: string; disabled_at: null },
    options: { onConflict: 'endpoint' },
  ): Promise<{ error: { message: string } | null }>;
  update(values: { disabled_at: string }): {
    eq(column: 'endpoint', value: string): {
      eq(column: 'patient_id', value: string): Promise<{ error: { message: string } | null }>;
    };
  };
};

function pushTable(client: AppSupabaseClient): PushWrite {
  return (client as unknown as { from(name: string): PushWrite }).from('push_subscriptions');
}

function readProcessVapidPublicKey(): string | null {
  return readVapidPublicKey(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY);
}

async function currentPatientId(): Promise<string | null> {
  const resolver = getSharedRemotePatientContextResolver();
  if (resolver === null) {
    return null;
  }
  const result = await resolver.resolve();
  return result.status === 'ready' ? result.context.patientId : null;
}

export async function syncBrowserPushSubscription(
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<'synced' | 'created' | 'failed'> {
  if (client === null || typeof navigator === 'undefined' || navigator.serviceWorker === undefined) {
    return 'failed';
  }
  const applicationServerKey = vapidPublicKeyToBytes(readProcessVapidPublicKey() ?? '');
  if (applicationServerKey === null) {
    return 'failed';
  }

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.ready;
  } catch {
    return 'failed';
  }

  return syncPushSubscription({
    getExisting: async () => {
      const current = await registration.pushManager.getSubscription();
      return subscriptionKeys(current?.toJSON() ?? null);
    },
    subscribe: async () => {
      try {
        const created = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        return subscriptionKeys(created.toJSON());
      } catch {
        return null;
      }
    },
    save: async (keys) => {
      const patientId = await currentPatientId();
      if (patientId === null) {
        return 'failed';
      }
      const result = await pushTable(client).upsert(
        {
          patient_id: patientId,
          endpoint: keys.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          last_seen_at: new Date().toISOString(),
          disabled_at: null,
        },
        { onConflict: 'endpoint' },
      );
      return result.error === null ? 'ok' : 'failed';
    },
  });
}

export async function recordExistingBrowserPushSubscription(
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<'synced' | 'missing' | 'failed'> {
  if (client === null || typeof navigator === 'undefined' || navigator.serviceWorker === undefined) {
    return 'failed';
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const current = await registration.pushManager.getSubscription();
    const keys = subscriptionKeys(current?.toJSON() ?? null);
    if (keys === null) {
      return 'missing';
    }
    const patientId = await currentPatientId();
    if (patientId === null) {
      return 'failed';
    }
    const result = await pushTable(client).upsert(
      {
        patient_id: patientId,
        endpoint: keys.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        last_seen_at: new Date().toISOString(),
        disabled_at: null,
      },
      { onConflict: 'endpoint' },
    );
    return result.error === null ? 'synced' : 'failed';
  } catch {
    return 'failed';
  }
}

export async function disableBrowserPushSubscription(
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<'disabled' | 'failed'> {
  if (client === null || typeof navigator === 'undefined' || navigator.serviceWorker === undefined) {
    return 'failed';
  }
  const patientId = await currentPatientId();
  if (patientId === null) {
    return 'failed';
  }
  const registration = await navigator.serviceWorker.ready;
  const current = await registration.pushManager.getSubscription();
  const keys = subscriptionKeys(current?.toJSON() ?? null);
  if (current === null || keys === null) {
    return 'disabled';
  }
  return disablePushSubscription({
    unsubscribe: () => current.unsubscribe().then(() => undefined),
    markDisabled: async () => {
      const result = await pushTable(client)
        .update({ disabled_at: new Date().toISOString() })
        .eq('endpoint', keys.endpoint)
        .eq('patient_id', patientId);
      return result.error === null ? 'ok' : 'failed';
    },
  });
}

export async function browserPushSubscriptionActive(): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.serviceWorker === undefined) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const current = await registration.pushManager.getSubscription();
    return subscriptionKeys(current?.toJSON() ?? null) !== null;
  } catch {
    return false;
  }
}
