import type { NotificationPermissionAction } from './capability';

export type PushKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function subscriptionKeys(json: {
  endpoint?: string | null;
  keys?: { p256dh?: string; auth?: string };
} | null): PushKeys | null {
  if (json === null) {
    return null;
  }
  const endpoint = json.endpoint ?? '';
  const p256dh = json.keys?.p256dh ?? '';
  const auth = json.keys?.auth ?? '';
  if (!endpoint.startsWith('https://') || p256dh.length < 8 || auth.length < 8) {
    return null;
  }
  return { endpoint, p256dh, auth };
}

export async function syncPushSubscription(deps: {
  getExisting: () => Promise<PushKeys | null>;
  subscribe: () => Promise<PushKeys | null>;
  save: (keys: PushKeys) => Promise<'ok' | 'failed'>;
}): Promise<'synced' | 'created' | 'failed'> {
  const existing = await deps.getExisting();
  if (existing !== null) {
    return (await deps.save(existing)) === 'ok' ? 'synced' : 'failed';
  }
  const created = await deps.subscribe();
  if (created === null) {
    return 'failed';
  }
  return (await deps.save(created)) === 'ok' ? 'created' : 'failed';
}

export async function disablePushSubscription(deps: {
  unsubscribe: () => Promise<void>;
  markDisabled: () => Promise<'ok' | 'failed'>;
}): Promise<'disabled' | 'failed'> {
  try {
    await deps.unsubscribe();
  } catch {
    // The server flag still stops delivery if the browser unsubscribe fails.
  }
  return (await deps.markDisabled()) === 'ok' ? 'disabled' : 'failed';
}

export async function completeNotificationEnable(input: {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  requestPermission: () => Promise<'default' | 'granted' | 'denied'>;
  syncSubscription: () => Promise<'synced' | 'created' | 'failed'>;
  timeoutMs?: number;
}): Promise<'enabled' | 'denied' | 'failed'> {
  const timeoutMs = input.timeoutMs ?? 20000;
  try {
    return await withTimeout(runNotificationEnable(input), timeoutMs);
  } catch {
    return 'failed';
  }
}

async function runNotificationEnable(input: {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  requestPermission: () => Promise<'default' | 'granted' | 'denied'>;
  syncSubscription: () => Promise<'synced' | 'created' | 'failed'>;
}): Promise<'enabled' | 'denied' | 'failed'> {
  if (input.permission === 'denied' || input.permission === 'unsupported') {
    return 'denied';
  }
  if (input.permission !== 'granted') {
    const next = await input.requestPermission();
    if (next !== 'granted') {
      return 'denied';
    }
  }
  const synced = await input.syncSubscription();
  return synced === 'failed' ? 'failed' : 'enabled';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function enableReminders(input: {
  action: NotificationPermissionAction;
  requestPermission: () => Promise<'default' | 'granted' | 'denied'>;
  syncSubscription: () => Promise<'synced' | 'created' | 'failed'>;
}): Promise<'enabled' | 'denied' | 'install' | 'unsupported' | 'failed'> {
  if (input.action === 'install') {
    return 'install';
  }
  if (input.action === 'unsupported') {
    return 'unsupported';
  }
  if (input.action === 'denied') {
    return 'denied';
  }
  if (input.action === 'request') {
    const permission = await input.requestPermission();
    if (permission !== 'granted') {
      return 'denied';
    }
  }
  const synced = await input.syncSubscription();
  return synced === 'failed' ? 'failed' : 'enabled';
}

export function vapidPublicKeyToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]{80,200}$/.test(value) || value.includes('PRIVATE')) {
    return null;
  }
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (padded.length % 4)) % 4);
    const binary = globalThis.atob(`${padded}${pad}`);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function readVapidPublicKey(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return vapidPublicKeyToBytes(trimmed) === null ? null : trimmed;
}
