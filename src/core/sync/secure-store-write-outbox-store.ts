import * as SecureStore from 'expo-secure-store';

import type { WriteOutboxItem, WriteOutboxStore } from './write-outbox';

export function createSecureStoreWriteOutboxStore<T>(
  storageKey: string,
  secureStore: {
    getItemAsync: (key: string) => Promise<string | null>;
    setItemAsync: (key: string, value: string) => Promise<void>;
  } = SecureStore,
): WriteOutboxStore<T> {
  return {
    async load() {
      try {
        const raw = await secureStore.getItemAsync(storageKey);
        if (raw === null || raw === '') {
          return [];
        }

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.filter(isOutboxItem) as WriteOutboxItem<T>[];
      } catch {
        return [];
      }
    },
    async save(items) {
      await secureStore.setItemAsync(storageKey, JSON.stringify(items));
    },
  };
}

function isOutboxItem(value: unknown): value is WriteOutboxItem<unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.authUserId === 'string' &&
    typeof record.createdAt === 'string' &&
    'payload' in record
  );
}
