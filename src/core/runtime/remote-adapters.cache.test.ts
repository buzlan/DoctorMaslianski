import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  clearRemoteUserScopedCaches,
  REMOTE_OUTBOX_STORAGE_KEYS,
} from './remote-adapters';

describe('clearRemoteUserScopedCaches', () => {
  it('deletes the existing remote outbox keys and drops in-memory adapters', async () => {
    await AsyncStorage.setItem(REMOTE_OUTBOX_STORAGE_KEYS.completions, '[]');
    await AsyncStorage.setItem(REMOTE_OUTBOX_STORAGE_KEYS.feedback, '[]');
    await AsyncStorage.setItem(REMOTE_OUTBOX_STORAGE_KEYS.productEvents, '[]');
    await AsyncStorage.setItem(REMOTE_OUTBOX_STORAGE_KEYS.patientPhotos, '[]');
    await SecureStore.setItemAsync(REMOTE_OUTBOX_STORAGE_KEYS.diary, '[]');

    await clearRemoteUserScopedCaches();

    expect(await AsyncStorage.getItem(REMOTE_OUTBOX_STORAGE_KEYS.completions)).toBeNull();
    expect(await AsyncStorage.getItem(REMOTE_OUTBOX_STORAGE_KEYS.feedback)).toBeNull();
    expect(await AsyncStorage.getItem(REMOTE_OUTBOX_STORAGE_KEYS.productEvents)).toBeNull();
    expect(await AsyncStorage.getItem(REMOTE_OUTBOX_STORAGE_KEYS.patientPhotos)).toBeNull();
    expect(await SecureStore.getItemAsync(REMOTE_OUTBOX_STORAGE_KEYS.diary)).toBeNull();
  });
});
