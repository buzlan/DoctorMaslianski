export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type SupabaseEnvInvalidReason =
  | 'url_invalid'
  | 'key_missing'
  | 'key_secret'
  | 'key_malformed';

export type SupabasePublicEnvResult =
  | { status: 'ready'; config: SupabasePublicConfig }
  | { status: 'missing' }
  | { status: 'invalid'; reason: SupabaseEnvInvalidReason };

export type SupabasePublicEnvSource = {
  url?: string;
  publishableKey?: string;
  anonKey?: string;
};

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isJwtShaped(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function decodeBase64UrlJson(value: string): unknown {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const json = globalThis.atob(`${padded}${'='.repeat(padLength)}`);
  return JSON.parse(json) as unknown;
}

function readJwtRole(key: string): 'ok' | 'secret' | 'malformed' {
  if (!isJwtShaped(key)) {
    return 'ok';
  }

  try {
    const payload = decodeBase64UrlJson(key.split('.')[1]);
    if (payload === null || typeof payload !== 'object') {
      return 'malformed';
    }

    const role = (payload as { role?: unknown }).role;
    if (role === 'service_role') {
      return 'secret';
    }

    return 'ok';
  } catch {
    return 'malformed';
  }
}

function readPublicKey(
  publishableKey: string,
  anonKey: string,
): { status: 'ready'; key: string } | { status: 'invalid'; reason: SupabaseEnvInvalidReason } {
  const key = publishableKey || anonKey;
  if (key.length === 0) {
    return { status: 'invalid', reason: 'key_missing' };
  }

  if (key.startsWith('sb_secret_')) {
    return { status: 'invalid', reason: 'key_secret' };
  }

  const jwtRole = readJwtRole(key);
  if (jwtRole === 'secret') {
    return { status: 'invalid', reason: 'key_secret' };
  }
  if (jwtRole === 'malformed') {
    return { status: 'invalid', reason: 'key_malformed' };
  }

  return { status: 'ready', key };
}

/**
 * Static process.env reads so Expo Metro can inline EXPO_PUBLIC_ values.
 * Do not replace these with dynamic process.env[name] access.
 */
export function readProcessSupabasePublicEnv(): SupabasePublicEnvSource {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function readSupabasePublicEnv(
  source: SupabasePublicEnvSource = readProcessSupabasePublicEnv(),
): SupabasePublicEnvResult {
  const url = trimEnv(source.url);
  const publishableKey = trimEnv(source.publishableKey);
  const anonKey = trimEnv(source.anonKey);

  if (url.length === 0 && publishableKey.length === 0 && anonKey.length === 0) {
    return { status: 'missing' };
  }

  if (!isHttpUrl(url)) {
    return { status: 'invalid', reason: 'url_invalid' };
  }

  const key = readPublicKey(publishableKey, anonKey);
  if (key.status === 'invalid') {
    return key;
  }

  return {
    status: 'ready',
    config: {
      url,
      publishableKey: key.key,
    },
  };
}
