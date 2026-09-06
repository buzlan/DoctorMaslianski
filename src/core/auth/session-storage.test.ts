import {
  AUTH_SESSION_CHUNK_BYTE_SIZE,
  authStorageChunkKey,
  authStorageManifestKey,
  createChunkedSecureStoreAuthStorage,
  parseAuthSessionManifest,
  splitUtf8Chunks,
  type SecureStoreLike,
} from './session-storage';

function createMemorySecureStore(
  hooks: {
    beforeSetItem?: (key: string, value: string) => void;
  } = {},
): SecureStoreLike & { snapshot(): Record<string, string> } {
  const items = new Map<string, string>();

  return {
    async getItemAsync(key) {
      return items.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      hooks.beforeSetItem?.(key, value);
      items.set(key, value);
    },
    async deleteItemAsync(key) {
      items.delete(key);
    },
    snapshot() {
      return Object.fromEntries(items.entries());
    },
  };
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

describe('splitUtf8Chunks', () => {
  it('splits by UTF-8 byte size, not string.length', () => {
    const payload = 'й'.repeat(2000);

    expect(payload.length).toBe(2000);
    expect(utf8Bytes(payload)).toBe(4000);

    const byCodeUnits = Math.ceil(payload.length / AUTH_SESSION_CHUNK_BYTE_SIZE);
    const chunks = splitUtf8Chunks(payload);

    expect(chunks.length).toBeGreaterThan(byCodeUnits);
    expect(chunks.join('')).toBe(payload);
    for (const chunk of chunks) {
      expect(utf8Bytes(chunk)).toBeLessThanOrEqual(AUTH_SESSION_CHUNK_BYTE_SIZE);
    }
  });
});

describe('createChunkedSecureStoreAuthStorage', () => {
  it('round-trips a payload larger than 2048 bytes', async () => {
    const memory = createMemorySecureStore();
    const storage = createChunkedSecureStoreAuthStorage(memory);
    const payload = `{"access_token":"${'a'.repeat(2500)}","user":{"id":"user-1"}}`;

    await storage.setItem('sb-test-auth-token', payload);

    expect(await storage.getItem('sb-test-auth-token')).toBe(payload);
    expect(utf8Bytes(payload)).toBeGreaterThan(2048);

    const manifest = parseAuthSessionManifest(
      memory.snapshot()[authStorageManifestKey('sb-test-auth-token')],
    );
    expect(manifest?.generation).toBe(1);
    expect(manifest?.chunkCount).toBeGreaterThan(1);
  });

  it('keeps the previous generation readable when a new write fails mid-chunk', async () => {
    const memory = createMemorySecureStore({
      beforeSetItem(key) {
        if (key === authStorageChunkKey('session', 2, 1)) {
          throw new Error('chunk write failed');
        }
      },
    });
    const storage = createChunkedSecureStoreAuthStorage(memory);
    const first = 'A'.repeat(4000);
    await storage.setItem('session', first);

    await expect(storage.setItem('session', 'B'.repeat(4000))).rejects.toThrow(
      'chunk write failed',
    );

    expect(await storage.getItem('session')).toBe(first);
    expect(memory.snapshot()[authStorageChunkKey('session', 2, 0)]).toBeUndefined();
    expect(memory.snapshot()[authStorageChunkKey('session', 2, 1)]).toBeUndefined();
    expect(parseAuthSessionManifest(memory.snapshot()[authStorageManifestKey('session')])?.generation).toBe(
      1,
    );
  });

  it('removes the previous generation after a successful overwrite', async () => {
    const memory = createMemorySecureStore();
    const storage = createChunkedSecureStoreAuthStorage(memory);
    await storage.setItem('session', 'A'.repeat(4000));
    await storage.setItem('session', 'B'.repeat(4000));

    expect(await storage.getItem('session')).toBe('B'.repeat(4000));
    expect(memory.snapshot()[authStorageChunkKey('session', 1, 0)]).toBeUndefined();
    expect(parseAuthSessionManifest(memory.snapshot()[authStorageManifestKey('session')])?.generation).toBe(
      2,
    );
  });

  it('rejects an incomplete generation instead of returning a truncated session', async () => {
    const memory = createMemorySecureStore();
    const storage = createChunkedSecureStoreAuthStorage(memory);
    await storage.setItem('session', 'C'.repeat(4000));
    await memory.deleteItemAsync(authStorageChunkKey('session', 1, 1));

    expect(await storage.getItem('session')).toBeNull();
  });

  it('removes the manifest and known generation chunks', async () => {
    const memory = createMemorySecureStore();
    const storage = createChunkedSecureStoreAuthStorage(memory);
    await storage.setItem('session', 'D'.repeat(4000));
    await storage.removeItem('session');

    expect(await storage.getItem('session')).toBeNull();
    expect(Object.keys(memory.snapshot())).toEqual([]);
  });
});
