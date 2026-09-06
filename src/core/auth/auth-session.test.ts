import {
  applySession,
  getAuthSessionSnapshot,
  resetAuthSessionForTests,
  signOut,
  startAuthSession,
  type AuthClientLike,
  type AuthClientSession,
  type AppStateLike,
} from './auth-session';

type FakeOptions = {
  initialSession?: AuthClientSession;
  setSession?: AuthClientLike['auth']['setSession'];
  signOut?: AuthClientLike['auth']['signOut'];
};

function createFakeAuthClient(options: FakeOptions = {}) {
  let session: AuthClientSession = options.initialSession ?? null;
  const authListeners = new Set<(event: string, next: AuthClientSession) => void>();
  let startCount = 0;
  let stopCount = 0;

  const client: AuthClientLike & {
    startCount: () => number;
    stopCount: () => number;
    currentSession: () => AuthClientSession;
  } = {
    auth: {
      onAuthStateChange(callback) {
        authListeners.add(callback);
        callback('INITIAL_SESSION', session);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      setSession: options.setSession
        ?? (async () => {
          session = { user: { id: 'user-1' } };
          for (const listener of authListeners) {
            listener('SIGNED_IN', session);
          }
          return { data: { session }, error: null };
        }),
      signOut: options.signOut
        ?? (async () => {
          session = null;
          for (const listener of authListeners) {
            listener('SIGNED_OUT', null);
          }
          return { error: null };
        }),
      async getSession() {
        return { data: { session } };
      },
      startAutoRefresh() {
        startCount += 1;
      },
      stopAutoRefresh() {
        stopCount += 1;
      },
    },
    startCount: () => startCount,
    stopCount: () => stopCount,
    currentSession: () => session,
  };

  return client;
}

function createFakeAppState(initial = 'active'): AppStateLike & {
  emit: (state: string) => void;
  listenerCount: () => number;
} {
  let currentState = initial;
  const listeners = new Set<(state: string) => void>();

  return {
    get currentState() {
      return currentState;
    },
    addEventListener(_type, listener) {
      listeners.add(listener);
      return {
        remove() {
          listeners.delete(listener);
        },
      };
    },
    emit(state) {
      currentState = state;
      for (const listener of listeners) {
        listener(state);
      }
    },
    listenerCount: () => listeners.size,
  };
}

describe('auth session', () => {
  afterEach(() => {
    resetAuthSessionForTests();
  });

  it('is unavailable when the client is missing', () => {
    expect(startAuthSession({ client: null })).toEqual({ status: 'unavailable' });
    expect(getAuthSessionSnapshot()).toEqual({ status: 'unavailable' });
  });

  it('becomes authenticated after the first confirmed session event', () => {
    startAuthSession({
      client: createFakeAuthClient({
        initialSession: { user: { id: 'user-1' } },
      }),
      appState: createFakeAppState(),
    });

    expect(getAuthSessionSnapshot()).toEqual({
      status: 'authenticated',
      userId: 'user-1',
    });
  });

  it('becomes unauthenticated after the first empty session event', () => {
    startAuthSession({
      client: createFakeAuthClient(),
      appState: createFakeAppState(),
    });

    expect(getAuthSessionSnapshot()).toEqual({ status: 'unauthenticated' });
  });

  it('sets authenticated only after setSession confirms a user', async () => {
    startAuthSession({
      client: createFakeAuthClient(),
      appState: createFakeAppState(),
    });

    const result = await applySession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(result).toEqual({ status: 'authenticated', userId: 'user-1' });
    expect(getAuthSessionSnapshot()).toEqual({
      status: 'authenticated',
      userId: 'user-1',
    });
  });

  it('does not expose authenticated when setSession fails', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let leftover: AuthClientSession = { user: { id: 'partial' } };

    const client = createFakeAuthClient({
      async setSession() {
        leftover = { user: { id: 'partial' } };
        return { data: { session: null }, error: { message: 'invalid' } };
      },
      async signOut() {
        leftover = null;
        return { error: null };
      },
    });
    client.auth.getSession = async () => ({ data: { session: leftover } });

    startAuthSession({ client, appState: createFakeAppState() });

    const result = await applySession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(result).toEqual({ status: 'failed' });
    expect(getAuthSessionSnapshot()).toEqual({ status: 'unauthenticated' });
    expect(leftover).toBeNull();
    expect(JSON.stringify(log.mock.calls)).not.toContain('access-token');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('access-token');
    expect(JSON.stringify(error.mock.calls)).not.toContain('refresh-token');
    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });

  it('publishes unauthenticated only after sign-out is confirmed', async () => {
    startAuthSession({
      client: createFakeAuthClient({
        initialSession: { user: { id: 'user-1' } },
      }),
      appState: createFakeAppState(),
    });

    await expect(signOut()).resolves.toEqual({ status: 'unauthenticated' });
    expect(getAuthSessionSnapshot()).toEqual({ status: 'unauthenticated' });
  });

  it('keeps the last confirmed session when sign-out fails', async () => {
    startAuthSession({
      client: createFakeAuthClient({
        initialSession: { user: { id: 'user-1' } },
        async signOut() {
          return { error: { message: 'network' } };
        },
      }),
      appState: createFakeAppState(),
    });

    await expect(signOut()).resolves.toEqual({ status: 'failed' });
    expect(getAuthSessionSnapshot()).toEqual({
      status: 'authenticated',
      userId: 'user-1',
    });
  });

  it('starts and stops auto refresh from a single AppState listener', () => {
    const appState = createFakeAppState('active');
    const client = createFakeAuthClient();

    startAuthSession({ client, appState });
    startAuthSession({ client, appState });

    expect(appState.listenerCount()).toBe(1);
    expect(client.startCount()).toBe(1);

    appState.emit('background');
    expect(client.stopCount()).toBe(1);

    appState.emit('active');
    expect(client.startCount()).toBe(2);
  });

  it('does not leak listeners after reset', () => {
    const appState = createFakeAppState();
    startAuthSession({
      client: createFakeAuthClient(),
      appState,
    });

    resetAuthSessionForTests();
    expect(appState.listenerCount()).toBe(0);
    expect(getAuthSessionSnapshot()).toEqual({ status: 'loading' });
  });
});
