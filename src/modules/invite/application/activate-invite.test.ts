import { activatePendingInvite } from './activate-invite';

describe('activatePendingInvite', () => {
  const token = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE';

  it('requires both consents before consume', async () => {
    const consume = jest.fn();
    const result = await activatePendingInvite(
      { privacyAccepted: true, pilotConsentAccepted: false },
      {
        consume,
        readPending: () => token,
      },
    );

    expect(result).toEqual({ status: 'error', error: 'unusable' });
    expect(consume).not.toHaveBeenCalled();
  });

  it('applies the returned session only after a successful consume', async () => {
    const apply = jest.fn(async () => ({ status: 'authenticated' as const, userId: 'user-1' }));
    const invalidate = jest.fn();
    const clearPending = jest.fn();

    const result = await activatePendingInvite(
      { privacyAccepted: true, pilotConsentAccepted: true },
      {
        consume: async () => ({
          status: 'ok',
          tokens: { accessToken: 'a', refreshToken: 'r' },
        }),
        apply,
        getClient: () => ({ functions: { invoke: jest.fn() } }) as never,
        getResolver: () => ({
          invalidate,
          resolve: async () => ({
            status: 'ready',
            context: {
              authUserId: 'user-1',
              patientId: 'p1',
              clinicId: 'c1',
              pilotCohort: 'internal_dry_run',
              clinicTimeZone: 'Europe/Minsk',
              contact: {},
            },
          }),
        }),
        readPending: () => token,
        clearPending,
      },
    );

    expect(apply).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
    expect(invalidate).toHaveBeenCalled();
    expect(clearPending).toHaveBeenCalled();
    expect(result).toEqual({ status: 'activated' });
  });

  it('maps a missing backend client as a service failure', async () => {
    const consume = jest.fn();
    const result = await activatePendingInvite(
      { privacyAccepted: true, pilotConsentAccepted: true },
      {
        consume,
        getClient: () => null,
        readPending: () => token,
      },
    );

    expect(result).toEqual({ status: 'error', error: 'service' });
    expect(consume).not.toHaveBeenCalled();
  });

  it('does not apply a session when consume fails', async () => {
    const apply = jest.fn();
    const result = await activatePendingInvite(
      { privacyAccepted: true, pilotConsentAccepted: true },
      {
        consume: async () => ({ status: 'error', error: 'expired' }),
        apply,
        getClient: () => ({ functions: { invoke: jest.fn() } }) as never,
        readPending: () => token,
      },
    );

    expect(apply).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'error', error: 'expired' });
  });

  it('signs out an unlinked session after applySession', async () => {
    const signOutSession = jest.fn(async () => ({ status: 'unauthenticated' as const }));
    const result = await activatePendingInvite(
      { privacyAccepted: true, pilotConsentAccepted: true },
      {
        consume: async () => ({
          status: 'ok',
          tokens: { accessToken: 'a', refreshToken: 'r' },
        }),
        apply: async () => ({ status: 'authenticated', userId: 'user-1' }),
        signOutSession,
        getClient: () => ({ functions: { invoke: jest.fn() } }) as never,
        getResolver: () => ({
          invalidate: () => undefined,
          resolve: async () => ({ status: 'unlinked', authUserId: 'user-1' }),
        }),
        readPending: () => token,
        clearPending: () => undefined,
      },
    );

    expect(signOutSession).toHaveBeenCalled();
    expect(result).toEqual({ status: 'error', error: 'unusable' });
  });
});
