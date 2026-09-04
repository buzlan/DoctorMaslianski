import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createChunkedSecureStoreAuthStorage } from '../auth/session-storage';
import {
  readSupabasePublicEnv,
  type SupabasePublicConfig,
  type SupabasePublicEnvResult,
} from '../env/supabase-env';

/**
 * Auth sessions persist through the TASK-022 generation-based SecureStore
 * adapter. Do not default to AsyncStorage. Tests may inject memory storage.
 */
export type SupabaseAuthStorage = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

export type CreateSupabaseClientOptions = {
  authStorage?: SupabaseAuthStorage;
};

let sharedClient: SupabaseClient | null | undefined;
let hasWarned = false;

function warnWhenUnavailable(envResult: SupabasePublicEnvResult): void {
  if (!__DEV__ || hasWarned || envResult.status === 'ready') {
    return;
  }

  hasWarned = true;
  if (envResult.status === 'missing') {
    console.warn(
      'Supabase env is missing. The app will keep using local repositories until TASK-031.',
    );
    return;
  }

  console.warn(
    `Supabase env is invalid (${envResult.reason}). The app will keep using local repositories until TASK-031.`,
  );
}

export function createSupabaseClient(
  config: SupabasePublicConfig,
  options: CreateSupabaseClientOptions = {},
): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      storage: options.authStorage ?? createChunkedSecureStoreAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseClientFromEnv(
  envResult: SupabasePublicEnvResult = readSupabasePublicEnv(),
  options: CreateSupabaseClientOptions = {},
): SupabaseClient | null {
  if (envResult.status !== 'ready') {
    warnWhenUnavailable(envResult);
    return null;
  }

  return createSupabaseClient(envResult.config, options);
}

export function getSharedSupabaseClient(): SupabaseClient | null {
  if (sharedClient !== undefined) {
    return sharedClient;
  }

  sharedClient = createSupabaseClientFromEnv();
  return sharedClient;
}

export function resetSharedSupabaseClientForTests(): void {
  sharedClient = undefined;
  hasWarned = false;
}
