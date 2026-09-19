import { useSyncExternalStore } from 'react';

import {
  getAuthSessionSnapshot,
  subscribeAuthSession,
  type AuthSessionState,
} from './auth-session';

export function useAuthSession(): AuthSessionState {
  return useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot,
  );
}
