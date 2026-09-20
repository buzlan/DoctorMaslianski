export {
  applySession,
  ensureAuthSessionStarted,
  getAuthSessionSnapshot,
  publishLocalUnauthenticated,
  resetAuthSessionForTests,
  signOut,
  startAuthSession,
  subscribeAuthSession,
} from './auth-session';
export type {
  ApplySessionResult,
  ApplySessionTokens,
  AuthSessionState,
  SignOutResult,
} from './auth-session';

export { resolveAuthGate } from './resolve-auth-gate';
export type { AccessReason, AuthGate } from './resolve-auth-gate';

export {
  authSessionStorageKeysForBaseKey,
  createChunkedSecureStoreAuthStorage,
  removeAuthSessionStorageKeys,
} from './session-storage';

export { resetLocalPatientSession } from './reset-local-patient-session';
export type {
  ResetLocalPatientSessionDeps,
  ResetLocalPatientSessionResult,
} from './reset-local-patient-session';

export { readSupabaseAuthStorageKey } from './read-supabase-auth-storage-key';

export { useAuthSession } from './use-auth-session';

export {
  createRemotePatientContextResolver,
} from './remote-patient-context';
export type {
  RemotePatientContext,
  RemotePatientContextResult,
  RemotePatientContextResolver,
} from './remote-patient-context';

export {
  getSharedRemotePatientContextResolver,
  resetSharedRemotePatientContextResolver,
  resetSharedRemotePatientContextResolverForTests,
  resolveSharedRemotePatientContext,
} from './shared-remote-patient-context';
