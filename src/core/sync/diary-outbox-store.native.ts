import * as SecureStore from 'expo-secure-store';

import { createSecureStoreWriteOutboxStore } from './secure-store-write-outbox-store';
import type { WriteOutboxStore } from './write-outbox';

export function createDiaryOutboxStore<T>(storageKey: string): WriteOutboxStore<T> {
  return createSecureStoreWriteOutboxStore<T>(storageKey);
}

export async function clearDiaryOutbox(storageKey: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey);
}
