import { resolveAuthGate } from './resolve-auth-gate';

describe('resolveAuthGate', () => {
  it('keeps the loading screen while auth is unknown', () => {
    expect(resolveAuthGate({ status: 'loading' }, true)).toEqual({
      screen: 'loading',
    });
    expect(resolveAuthGate({ status: 'loading' }, false)).toEqual({
      screen: 'loading',
    });
  });

  it('keeps the local clinical shell when the client is unavailable in development', () => {
    expect(resolveAuthGate({ status: 'unavailable' }, true)).toEqual({
      screen: 'clinical',
    });
  });

  it('uses service_unavailable when the client is unavailable in production', () => {
    expect(resolveAuthGate({ status: 'unavailable' }, false)).toEqual({
      screen: 'access',
      reason: 'service_unavailable',
    });
  });

  it('uses authentication_required when there is no session', () => {
    expect(resolveAuthGate({ status: 'unauthenticated' }, true)).toEqual({
      screen: 'access',
      reason: 'authentication_required',
    });
    expect(resolveAuthGate({ status: 'unauthenticated' }, false)).toEqual({
      screen: 'access',
      reason: 'authentication_required',
    });
  });

  it('opens the clinical shell when a session is confirmed', () => {
    expect(
      resolveAuthGate({ status: 'authenticated', userId: 'user-1' }, true),
    ).toEqual({ screen: 'clinical' });
    expect(
      resolveAuthGate({ status: 'authenticated', userId: 'user-1' }, false),
    ).toEqual({ screen: 'clinical' });
  });
});
