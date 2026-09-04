import {
  createSupabaseClient,
  createSupabaseClientFromEnv,
  getSharedSupabaseClient,
  resetSharedSupabaseClientForTests,
} from './client';

const LOCAL_URL = 'http://127.0.0.1:54321';

function memoryAuthStorage() {
  const items = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      items.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      items.delete(key);
    }),
  };
}

describe('createSupabaseClientFromEnv', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetSharedSupabaseClientForTests();
  });

  it('returns null without throwing when env is missing', () => {
    expect(createSupabaseClientFromEnv({ status: 'missing' })).toBeNull();
  });

  it('returns null without throwing when env is invalid', () => {
    expect(
      createSupabaseClientFromEnv({ status: 'invalid', reason: 'url_invalid' }),
    ).toBeNull();
  });

  it('creates a client from valid env and injected auth storage', () => {
    const authStorage = memoryAuthStorage();

    const client = createSupabaseClientFromEnv(
      {
        status: 'ready',
        config: {
          url: LOCAL_URL,
          publishableKey: 'sb_publishable_test',
        },
      },
      { authStorage },
    );

    expect(client).not.toBeNull();
    expect(client?.auth).toBeDefined();
  });
});

describe('createSupabaseClient', () => {
  it('configures Auth persistence without starting an auth flow', () => {
    const authStorage = memoryAuthStorage();

    const client = createSupabaseClient(
      {
        url: LOCAL_URL,
        publishableKey: 'sb_publishable_test',
      },
      { authStorage },
    );

    expect(client.auth).toBeDefined();
    expect(typeof client.auth.getSession).toBe('function');
  });

  it('uses the hardened SecureStore adapter when storage is not injected', () => {
    const client = createSupabaseClient({
      url: LOCAL_URL,
      publishableKey: 'sb_publishable_test',
    });

    expect(client.auth).toBeDefined();
    expect(typeof client.auth.getSession).toBe('function');
  });
});

describe('getSharedSupabaseClient', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetSharedSupabaseClientForTests();
  });

  it('does not throw when process env is unset', () => {
    expect(() => getSharedSupabaseClient()).not.toThrow();
  });
});
