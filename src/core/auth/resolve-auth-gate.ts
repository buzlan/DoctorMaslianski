import type { AuthSessionState } from './auth-session';

export type AccessReason = 'authentication_required' | 'service_unavailable';

export type AuthGate =
  | { screen: 'loading' }
  | { screen: 'access'; reason: AccessReason }
  | { screen: 'clinical' };

export function resolveAuthGate(
  auth: AuthSessionState,
  isDev: boolean,
): AuthGate {
  if (auth.status === 'loading') {
    return { screen: 'loading' };
  }

  if (auth.status === 'authenticated') {
    return { screen: 'clinical' };
  }

  if (auth.status === 'unavailable') {
    if (isDev) {
      return { screen: 'clinical' };
    }

    return { screen: 'access', reason: 'service_unavailable' };
  }

  return { screen: 'access', reason: 'authentication_required' };
}
