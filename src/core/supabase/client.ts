import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createChunkedSecureStoreAuthStorage } from '../auth/session-storage';
import {
  readSupabasePublicEnv,
  type SupabasePublicConfig,
  type SupabasePublicEnvResult,
} from '../env/supabase-env';

import type { Database } from './database.types';

export type AppSupabaseClient = SupabaseClient<Database>;

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

let sharedClient: AppSupabaseClient | null | undefined;
let hasWarned = false;

function warnWhenUnavailable(envResult: SupabasePublicEnvResult): void {
  if (!__DEV__ || hasWarned || envResult.status === 'ready') {
    return;
  }

  hasWarned = true;
  if (envResult.status === 'missing') {
    console.warn(
      'Supabase env is missing. Authenticated remote repositories are unavailable; local fixtures remain in __DEV__.',
    );
    return;
  }

  console.warn(
    `Supabase env is invalid (${envResult.reason}). Authenticated remote repositories are unavailable; local fixtures remain in __DEV__.`,
  );
}

export function createSupabaseClient(
  config: SupabasePublicConfig,
  options: CreateSupabaseClientOptions = {},
): AppSupabaseClient {
  return createClient<Database>(config.url, config.publishableKey, {
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
): AppSupabaseClient | null {
  if (envResult.status !== 'ready') {
    warnWhenUnavailable(envResult);
    return null;
  }

  return createSupabaseClient(envResult.config, options);
}

export function getSharedSupabaseClient(): AppSupabaseClient | null {
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
