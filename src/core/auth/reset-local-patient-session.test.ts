import { resetLocalPatientSession } from './reset-local-patient-session';
import { readSupabaseAuthStorageKey } from './read-supabase-auth-storage-key';
import { authSessionStorageKeysForBaseKey } from './session-storage';

describe('authSessionStorageKeysForBaseKey', () => {
  it('returns the live client key plus supabase-js _removeSession suffixes', () => {
    expect(authSessionStorageKeysForBaseKey('sb-project-auth-token')).toEqual([
      'sb-project-auth-token',
      'sb-project-auth-token-code-verifier',
      'sb-project-auth-token-user',
    ]);
  });
});

describe('readSupabaseAuthStorageKey', () => {
  it('reads storageKey from the client instance', () => {
    expect(readSupabaseAuthStorageKey({ storageKey: 'sb-from-client-auth-token' })).toBe(
      'sb-from-client-auth-token',
    );
  });

  it('falls back to auth.storageKey', () => {
    expect(
      readSupabaseAuthStorageKey({ auth: { storageKey: 'sb-from-auth-auth-token' } }),
    ).toBe('sb-from-auth-auth-token');
  });

  it('returns null when the client has no storageKey', () => {
    expect(readSupabaseAuthStorageKey({})).toBeNull();
  });
});

describe('resetLocalPatientSession', () => {
  it('is a no-op outside DEV and does not touch local state', async () => {
    const signOutSession = jest.fn();
    const removeAuthStorageKeys = jest.fn();
    const resetResolver = jest.fn();
    const clearRemoteCaches = jest.fn();
    const clearPending = jest.fn();
    const publishUnauthenticated = jest.fn();

    await expect(
      resetLocalPatientSession({
        isDev: false,
        signOutSession,
        removeAuthStorageKeys,
        resetResolver,
        clearRemoteCaches,
        clearPending,
        publishUnauthenticated,
      }),
    ).resolves.toEqual({ status: 'ignored' });

    expect(signOutSession).not.toHaveBeenCalled();
    expect(removeAuthStorageKeys).not.toHaveBeenCalled();
    expect(resetResolver).not.toHaveBeenCalled();
    expect(clearRemoteCaches).not.toHaveBeenCalled();
    expect(clearPending).not.toHaveBeenCalled();
    expect(publishUnauthenticated).not.toHaveBeenCalled();
  });

  it('signs out, deletes the client auth keys, and clears patient-scoped local state', async () => {
    const invalidate = jest.fn();
    const signOutSession = jest.fn(async () => ({ status: 'unauthenticated' as const }));
    const removeAuthStorageKeys = jest.fn(async () => undefined);
    const resetResolver = jest.fn();
    const clearRemoteCaches = jest.fn(async () => undefined);
    const clearPending = jest.fn();
    const publishUnauthenticated = jest.fn();

    await expect(
      resetLocalPatientSession({
        isDev: true,
        signOutSession,
        getClient: () => ({ storageKey: 'sb-test-auth-token' }) as never,
        removeAuthStorageKeys,
        getResolver: () => ({
          invalidate,
          resolve: async () => ({ status: 'unauthenticated' as const }),
        }),
        resetResolver,
        clearRemoteCaches,
        clearPending,
        readAuth: () => ({ status: 'unauthenticated' }),
        publishUnauthenticated,
      }),
    ).resolves.toEqual({ status: 'cleared' });

    expect(invalidate).toHaveBeenCalled();
    expect(resetResolver).toHaveBeenCalled();
    expect(clearRemoteCaches).toHaveBeenCalled();
    expect(signOutSession).toHaveBeenCalled();
    expect(removeAuthStorageKeys).toHaveBeenCalledWith('sb-test-auth-token');
    expect(clearPending).toHaveBeenCalled();
    expect(publishUnauthenticated).not.toHaveBeenCalled();
  });

  it('forces the access gate when sign-out leaves an authenticated snapshot', async () => {
    const publishUnauthenticated = jest.fn();

    await resetLocalPatientSession({
      isDev: true,
      signOutSession: async () => ({ status: 'failed' }),
      getClient: () => ({ storageKey: 'sb-test-auth-token' }) as never,
      removeAuthStorageKeys: async () => undefined,
      getResolver: () => null,
      resetResolver: () => undefined,
      clearRemoteCaches: async () => undefined,
      clearPending: () => undefined,
      readAuth: () => ({ status: 'authenticated', userId: 'user-1' }),
      publishUnauthenticated,
    });

    expect(publishUnauthenticated).toHaveBeenCalled();
  });
});
