import { readSupabasePublicEnv } from './supabase-env';

function toBase64Url(value: string): string {
  return globalThis
    .btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function encodeJwt(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

const LOCAL_URL = 'http://127.0.0.1:54321';
const ANON_JWT = encodeJwt({ role: 'anon' });

describe('readSupabasePublicEnv', () => {
  it('returns missing when every value is absent', () => {
    expect(readSupabasePublicEnv({})).toEqual({ status: 'missing' });
  });

  it('returns missing when every value is whitespace', () => {
    expect(
      readSupabasePublicEnv({
        url: '   ',
        publishableKey: '\n',
        anonKey: '\t',
      }),
    ).toEqual({ status: 'missing' });
  });

  it('rejects an unparseable URL', () => {
    expect(
      readSupabasePublicEnv({
        url: 'not-a-url',
        publishableKey: 'sb_publishable_test',
      }),
    ).toEqual({ status: 'invalid', reason: 'url_invalid' });
  });

  it('rejects a non-http URL scheme', () => {
    expect(
      readSupabasePublicEnv({
        url: 'javascript:alert(1)',
        publishableKey: 'sb_publishable_test',
      }),
    ).toEqual({ status: 'invalid', reason: 'url_invalid' });
  });

  it('rejects a URL without a public key', () => {
    expect(readSupabasePublicEnv({ url: LOCAL_URL })).toEqual({
      status: 'invalid',
      reason: 'key_missing',
    });
  });

  it('accepts a local URL with a publishable key', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        publishableKey: 'sb_publishable_test',
      }),
    ).toEqual({
      status: 'ready',
      config: {
        url: LOCAL_URL,
        publishableKey: 'sb_publishable_test',
      },
    });
  });

  it('falls back to the anon key when the publishable key is unset', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        anonKey: ANON_JWT,
      }),
    ).toEqual({
      status: 'ready',
      config: {
        url: LOCAL_URL,
        publishableKey: ANON_JWT,
      },
    });
  });

  it('prefers the publishable key when both keys are set', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        publishableKey: 'sb_publishable_wins',
        anonKey: ANON_JWT,
      }),
    ).toEqual({
      status: 'ready',
      config: {
        url: LOCAL_URL,
        publishableKey: 'sb_publishable_wins',
      },
    });
  });

  it('rejects sb_secret_ keys', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        publishableKey: 'sb_secret_do_not_ship',
      }),
    ).toEqual({ status: 'invalid', reason: 'key_secret' });
  });

  it('rejects a JWT whose role is service_role', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        anonKey: encodeJwt({ role: 'service_role' }),
      }),
    ).toEqual({ status: 'invalid', reason: 'key_secret' });
  });

  it('rejects a JWT-shaped key that cannot be decoded', () => {
    expect(
      readSupabasePublicEnv({
        url: LOCAL_URL,
        anonKey: 'abc.not-json.sig',
      }),
    ).toEqual({ status: 'invalid', reason: 'key_malformed' });
  });
});
