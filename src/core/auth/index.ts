export {
  applySession,
  ensureAuthSessionStarted,
  getAuthSessionSnapshot,
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

export { createChunkedSecureStoreAuthStorage } from './session-storage';

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
  resetSharedRemotePatientContextResolverForTests,
  resolveSharedRemotePatientContext,
} from './shared-remote-patient-context';
