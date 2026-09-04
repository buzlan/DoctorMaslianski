export {
  applySession,
  createChunkedSecureStoreAuthStorage,
  ensureAuthSessionStarted,
  getAuthSessionSnapshot,
  resolveAuthGate,
  signOut,
  startAuthSession,
  subscribeAuthSession,
  useAuthSession,
} from './auth';
export type {
  AccessReason,
  ApplySessionResult,
  ApplySessionTokens,
  AuthGate,
  AuthSessionState,
  SignOutResult,
} from './auth';

export {
  readProcessSupabasePublicEnv,
  readSupabasePublicEnv,
} from './env/supabase-env';
export type {
  SupabaseEnvInvalidReason,
  SupabasePublicConfig,
  SupabasePublicEnvResult,
  SupabasePublicEnvSource,
} from './env/supabase-env';

export {
  createSupabaseClient,
  createSupabaseClientFromEnv,
  getSharedSupabaseClient,
} from './supabase/client';
export type {
  CreateSupabaseClientOptions,
  SupabaseAuthStorage,
} from './supabase/client';
