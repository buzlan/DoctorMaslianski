import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAsyncStorageWriteOutboxStore } from './async-storage-write-outbox-store';
import type { WriteOutboxStore } from './write-outbox';

export function createDiaryOutboxStore<T>(storageKey: string): WriteOutboxStore<T> {
  return createAsyncStorageWriteOutboxStore<T>(storageKey);
}

export async function clearDiaryOutbox(storageKey: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey);
}
