import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WriteOutboxItem, WriteOutboxStore } from './write-outbox';

export function createAsyncStorageWriteOutboxStore<T>(
  storageKey: string,
): WriteOutboxStore<T> {
  return {
    async load() {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
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
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
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
