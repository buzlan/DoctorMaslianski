/**
 * Generation-based crash-safe Auth session storage for supabase-js.
 *
 * TASK-030 persisted sessions in AsyncStorage as client plumbing only.
 * This adapter is the TASK-022 at-rest store for real-patient tokens.
 *
 * Do not write a Supabase session JSON to a single expo-secure-store key.
 * Historical iOS Keychain limits reject values around 2048 bytes; a session
 * (access token + refresh token + user) routinely exceeds that.
 *
 * Layout:
 * - manifest `{base}` → `{ version, generation, chunkCount }`
 * - chunks `{base}.g{generation}.c{index}` → one UTF-8 slice
 *
 * Writes land on a new generation first. The manifest switches only after
 * every new chunk succeeds. A failed write leaves the previous generation
 * readable. Incomplete generations are never returned.
 *
 * Device Keychain/Keystore encryption is not clinic-controlled encryption.
 * iOS Keychain may persist across uninstall with the same bundle id.
 * Do not read leftover TASK-030 AsyncStorage auth keys.
 */

import * as SecureStore from 'expo-secure-store';

import type { SupabaseAuthStorage } from '../supabase/client';

export const AUTH_SESSION_STORAGE_VERSION = 1;
export const AUTH_SESSION_CHUNK_BYTE_SIZE = 1800;

const STORAGE_KEY_SAFE = /[^A-Za-z0-9._-]/g;

export type SecureStoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export type AuthSessionManifest = {
  version: typeof AUTH_SESSION_STORAGE_VERSION;
  generation: number;
  chunkCount: number;
};

type KnownGeneration = {
  generation: number;
  chunkCount: number;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function sanitizeAuthStorageKey(key: string): string {
  return key.replace(STORAGE_KEY_SAFE, '_');
}

export function authStorageManifestKey(key: string): string {
  return sanitizeAuthStorageKey(key);
}

export function authStorageChunkKey(
  key: string,
  generation: number,
  index: number,
): string {
  return `${sanitizeAuthStorageKey(key)}.g${generation}.c${index}`;
}

export function splitUtf8Chunks(
  value: string,
  maxBytes: number = AUTH_SESSION_CHUNK_BYTE_SIZE,
): string[] {
  if (maxBytes < 4) {
    throw new Error('Auth session chunk size must fit a UTF-8 code point.');
  }

  const bytes = textEncoder.encode(value);
  if (bytes.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    let end = Math.min(offset + maxBytes, bytes.length);
    if (end < bytes.length) {
      while (end > offset && (bytes[end] & 0b1100_0000) === 0b1000_0000) {
        end -= 1;
      }
    }

    chunks.push(textDecoder.decode(bytes.subarray(offset, end)));
    offset = end;
  }

  return chunks;
}

export function parseAuthSessionManifest(raw: string | null): AuthSessionManifest | null {
  if (raw === null || raw === '') {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (record.version !== AUTH_SESSION_STORAGE_VERSION) {
    return null;
  }

  if (!Number.isInteger(record.generation) || (record.generation as number) < 1) {
    return null;
  }

  if (!Number.isInteger(record.chunkCount) || (record.chunkCount as number) < 0) {
    return null;
  }

  return {
    version: AUTH_SESSION_STORAGE_VERSION,
    generation: record.generation as number,
    chunkCount: record.chunkCount as number,
  };
}

function serializeManifest(manifest: AuthSessionManifest): string {
  return JSON.stringify(manifest);
}

function createDefaultSecureStore(): SecureStoreLike {
  const options = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  return {
    getItemAsync(key) {
      return SecureStore.getItemAsync(key, options);
    },
    setItemAsync(key, value) {
      return SecureStore.setItemAsync(key, value, options);
    },
    deleteItemAsync(key) {
      return SecureStore.deleteItemAsync(key, options);
    },
  };
}

async function deleteGeneration(
  store: SecureStoreLike,
  key: string,
  known: KnownGeneration,
): Promise<void> {
  for (let index = 0; index < known.chunkCount; index += 1) {
    try {
      await store.deleteItemAsync(authStorageChunkKey(key, known.generation, index));
    } catch {
      // Best-effort cleanup. Orphan Keychain residue is not a live session.
    }
  }
}

export function createChunkedSecureStoreAuthStorage(
  store: SecureStoreLike = createDefaultSecureStore(),
): SupabaseAuthStorage {
  const knownByKey = new Map<string, KnownGeneration[]>();

  function remember(key: string, known: KnownGeneration): void {
    const current = knownByKey.get(key) ?? [];
    const next = current.filter((item) => item.generation !== known.generation);
    next.push(known);
    knownByKey.set(key, next);
  }

  function forget(key: string, generation: number): void {
    const current = knownByKey.get(key);
    if (current === undefined) {
      return;
    }

    const next = current.filter((item) => item.generation !== generation);
    if (next.length === 0) {
      knownByKey.delete(key);
      return;
    }

    knownByKey.set(key, next);
  }

  async function readManifest(key: string): Promise<AuthSessionManifest | null> {
    let raw: string | null;
    try {
      raw = await store.getItemAsync(authStorageManifestKey(key));
    } catch {
      return null;
    }

    return parseAuthSessionManifest(raw);
  }

  return {
    async getItem(key) {
      const manifest = await readManifest(key);
      if (manifest === null) {
        return null;
      }

      if (manifest.chunkCount === 0) {
        return '';
      }

      const chunks: string[] = [];
      for (let index = 0; index < manifest.chunkCount; index += 1) {
        let chunk: string | null;
        try {
          chunk = await store.getItemAsync(
            authStorageChunkKey(key, manifest.generation, index),
          );
        } catch {
          return null;
        }

        if (chunk === null) {
          return null;
        }

        chunks.push(chunk);
      }

      return chunks.join('');
    },

    async setItem(key, value) {
      const previous = await readManifest(key);
      const generation = previous === null ? 1 : previous.generation + 1;
      const chunks = splitUtf8Chunks(value);
      const next: KnownGeneration = { generation, chunkCount: chunks.length };

      remember(key, next);

      try {
        for (let index = 0; index < chunks.length; index += 1) {
          await store.setItemAsync(
            authStorageChunkKey(key, generation, index),
            chunks[index],
          );
        }

        await store.setItemAsync(
          authStorageManifestKey(key),
          serializeManifest({
            version: AUTH_SESSION_STORAGE_VERSION,
            generation,
            chunkCount: chunks.length,
          }),
        );
      } catch (error) {
        await deleteGeneration(store, key, next);
        forget(key, generation);
        throw error;
      }

      if (previous !== null) {
        await deleteGeneration(store, key, previous);
        forget(key, previous.generation);
      }
    },

    async removeItem(key) {
      const manifest = await readManifest(key);
      const known = [...(knownByKey.get(key) ?? [])];

      if (manifest !== null) {
        known.push(manifest);
      }

      const unique = new Map<number, KnownGeneration>();
      for (const item of known) {
        unique.set(item.generation, item);
      }

      for (const item of unique.values()) {
        await deleteGeneration(store, key, item);
      }

      try {
        await store.deleteItemAsync(authStorageManifestKey(key));
      } catch {
        // Manifest already gone is a successful removal.
      }

      knownByKey.delete(key);
    },
  };
}
