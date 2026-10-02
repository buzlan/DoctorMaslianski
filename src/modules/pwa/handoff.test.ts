import {
  clearHandoffCookieAssignment,
  handoffCookieAssignment,
  HANDOFF_COOKIE_MAX_AGE_SECONDS,
  readHandoffCookie,
} from './handoff-cookie';
import { consumeWebSessionHandoff, createWebSessionHandoff } from './handoff-api';
import { prepareIosHandoff } from './prepare-ios-handoff';
import { planInstalledSessionRestore } from './restore-plan';
import { restoreInstalledSession } from './restore-installed-session';

const token = 'a'.repeat(43);

describe('handoff cookie', () => {
  it('stores only the opaque token with a short strict cookie', () => {
    const assignment = handoffCookieAssignment(token);
    expect(assignment).toContain(`pwa_handoff=${token}`);
    expect(assignment).toContain('Secure');
    expect(assignment).toContain('SameSite=Strict');
    expect(assignment).toContain('Path=/');
    expect(assignment).toContain(`Max-Age=${HANDOFF_COOKIE_MAX_AGE_SECONDS}`);
    expect(assignment).not.toContain('access_token');
    expect(assignment).not.toContain('refresh');
    expect(readHandoffCookie(`theme=light; ${assignment.split(';')[0]}`)).toBe(token);
    expect(readHandoffCookie('theme=light')).toBeNull();
    expect(readHandoffCookie('pwa_handoff=short')).toBeNull();
    expect(clearHandoffCookieAssignment()).toContain('Max-Age=0');
  });
});

describe('installed session restore plan', () => {
  it('consumes a handoff only for an installed app without a session', () => {
    expect(
      planInstalledSessionRestore({
        installed: false,
        authStatus: 'unauthenticated',
        handoffToken: token,
      }),
    ).toEqual({ type: 'skip' });
    expect(
      planInstalledSessionRestore({
        installed: true,
        authStatus: 'loading',
        handoffToken: token,
      }),
    ).toEqual({ type: 'wait' });
    expect(
      planInstalledSessionRestore({
        installed: true,
        authStatus: 'authenticated',
        handoffToken: token,
      }),
    ).toEqual({ type: 'skip' });
    expect(
      planInstalledSessionRestore({
        installed: true,
        authStatus: 'unauthenticated',
        handoffToken: null,
      }),
    ).toEqual({ type: 'missing' });
    expect(
      planInstalledSessionRestore({
        installed: true,
        authStatus: 'unauthenticated',
        handoffToken: token,
      }),
    ).toEqual({ type: 'consume', token });
  });
});

describe('session handoff client', () => {
  it('creates a handoff without sending session tokens', async () => {
    const invoke = jest.fn(async () => ({ data: { token }, error: null }));
    const result = await createWebSessionHandoff({ functions: { invoke } });
    expect(invoke).toHaveBeenCalledWith('create-web-session-handoff', { body: {} });
    expect(result).toEqual({ status: 'ok', token });
  });

  it('prepares the iOS cookie from the one-time token', async () => {
    const writes: string[] = [];
    const prepared = await prepareIosHandoff({
      create: async () => ({ status: 'ok', token }),
      writeCookie: (value) => {
        writes.push(value);
      },
    });
    expect(prepared).toBe('ready');
    expect(writes).toEqual([token]);
    expect(writes[0]?.includes('http')).toBe(false);
  });

  it('does not write a cookie when handoff creation fails', async () => {
    const writeCookie = jest.fn();
    const prepared = await prepareIosHandoff({
      create: async () => ({ status: 'failed' }),
      writeCookie,
    });
    expect(prepared).toBe('failed');
    expect(writeCookie).not.toHaveBeenCalled();
  });

  it('restores the existing session tokens and does not invent a user', async () => {
    const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1' };
    const apply = jest.fn(async () => ({ status: 'authenticated' }));
    const consume = jest.fn(async (value: string) => {
      expect(value).toBe(token);
      return { status: 'ok' as const, tokens };
    });
    const result = await restoreInstalledSession(token, { consume, apply });
    expect(result).toBe('restored');
    expect(apply).toHaveBeenCalledWith(tokens);
  });

  it('rejects an invalid, expired, or consumed handoff without applying a session', async () => {
    const invoke = jest.fn(async () => ({
      data: null,
      error: {
        context: {
          status: 400,
          json: async () => ({ error: 'consumed' }),
        },
      },
    }));
    const consumed = await consumeWebSessionHandoff({ functions: { invoke } }, token);
    expect(consumed.status).toBe('rejected');
    expect(invoke).toHaveBeenCalledWith('consume-web-session-handoff', { body: { token } });

    const apply = jest.fn();
    const result = await restoreInstalledSession(token, {
      consume: async () => ({ status: 'rejected' }),
      apply,
    });
    expect(result).toBe('rejected');
    expect(apply).not.toHaveBeenCalled();
  });
});
