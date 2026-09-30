import {
  authSessionStorageKeysForBaseKey,
  createBrowserAuthSessionStorage,
  removeAuthSessionStorageKeys,
  type WebStorageLike,
} from './session-storage.web';

function createMemoryStorage(): WebStorageLike & { snapshot(): Record<string, string> } {
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
    snapshot() {
      return Object.fromEntries(items);
    },
  };
}

describe('createBrowserAuthSessionStorage', () => {
  it('round-trips a session and removes supabase auth keys', async () => {
    const memory = createMemoryStorage();
    const storage = createBrowserAuthSessionStorage(memory);
    await storage.setItem('sb-project-auth-token', '{"access_token":"a"}');
    await storage.setItem('sb-project-auth-token-user', '{"id":"user"}');

    expect(storage.getItem('sb-project-auth-token')).toBe('{"access_token":"a"}');

    await removeAuthSessionStorageKeys('sb-project-auth-token', storage);

    expect(memory.snapshot()).toEqual({});
    expect(authSessionStorageKeysForBaseKey('sb-project-auth-token')).toEqual([
      'sb-project-auth-token',
      'sb-project-auth-token-code-verifier',
      'sb-project-auth-token-user',
    ]);
  });

  it('returns null when the backing store throws on read', async () => {
    const storage = createBrowserAuthSessionStorage({
      getItem() {
        throw new Error('blocked');
      },
      setItem() {},
      removeItem() {},
    });

    expect(storage.getItem('sb-project-auth-token')).toBeNull();
  });
});
