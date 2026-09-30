/**
 * Browser auth session storage for supabase-js.
 * Native keeps the chunked SecureStore adapter in session-storage.native.ts.
 *
 * localStorage survives reload and closing the browser. The invite token
 * is not stored here.
 */

import type { SupabaseAuthStorage } from '../supabase/client';

import { authSessionStorageKeysForBaseKey } from './session-storage-keys';

export type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function browserLocalStorage(): WebStorageLike | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') {
      return null;
    }
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function createMemoryWebStorage(): WebStorageLike {
  const items = new Map<string, string>();
  return {
    getItem(key) {
      return items.get(key) ?? null;
    },
    setItem(key, value) {
      items.set(key, value);
    },
    removeItem(key) {
      items.delete(key);
    },
  };
}

export function createBrowserAuthSessionStorage(
  storage: WebStorageLike | null = browserLocalStorage(),
): SupabaseAuthStorage {
  const resolved = storage ?? createMemoryWebStorage();

  return {
    getItem(key) {
      try {
        return resolved.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      resolved.setItem(key, value);
    },
    removeItem(key) {
      try {
        resolved.removeItem(key);
      } catch {
        // A missing key is already signed out.
      }
    },
  };
}

export function createAuthSessionStorage(): SupabaseAuthStorage {
  return createBrowserAuthSessionStorage();
}

/** Web has no Keychain chunk limit. The export name stays for shared imports. */
export function createChunkedSecureStoreAuthStorage(): SupabaseAuthStorage {
  return createAuthSessionStorage();
}

export { authSessionStorageKeysForBaseKey };

export async function removeAuthSessionStorageKeys(
  baseKey: string,
  storage: SupabaseAuthStorage = createAuthSessionStorage(),
): Promise<void> {
  for (const key of authSessionStorageKeysForBaseKey(baseKey)) {
    await storage.removeItem(key);
  }
}
