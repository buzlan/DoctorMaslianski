import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import { getSharedSupabaseClient } from '../supabase/client';

export type AuthSessionState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userId: string };

export type ApplySessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ApplySessionResult =
  | { status: 'authenticated'; userId: string }
  | { status: 'failed' };

export type SignOutResult = { status: 'unauthenticated' } | { status: 'failed' };

export type AuthSessionUser = {
  id: string;
};

export type AuthClientSession = {
  user?: AuthSessionUser | null;
} | null;

export type AuthClientLike = {
  auth: {
    onAuthStateChange: (
      callback: (event: string, session: AuthClientSession) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
    setSession: (tokens: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ data: { session: AuthClientSession }; error: { message: string } | null }>;
    signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<{
      error: { message: string } | null;
    }>;
    getSession: () => Promise<{ data: { session: AuthClientSession } }>;
    startAutoRefresh: () => void;
    stopAutoRefresh: () => void;
  };
};

export type AppStateLike = {
  currentState: string;
  addEventListener: (
    type: 'change',
    listener: (state: string) => void,
  ) => { remove: () => void };
};

export type StartAuthSessionOptions = {
  client?: AuthClientLike | null;
  appState?: AppStateLike;
};

const listeners = new Set<() => void>();

let state: AuthSessionState = { status: 'loading' };
let started = false;
let client: AuthClientLike | null = null;
let authSubscription: { unsubscribe: () => void } | null = null;
let appStateSubscription: { remove: () => void } | NativeEventSubscription | null = null;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function publishConfirmed(next: AuthSessionState): void {
  if (statesEqual(state, next)) {
    return;
  }

  state = next;
  emit();
}

function statesEqual(left: AuthSessionState, right: AuthSessionState): boolean {
  if (left.status !== right.status) {
    return false;
  }

  if (left.status === 'authenticated' && right.status === 'authenticated') {
    return left.userId === right.userId;
  }

  return true;
}

function confirmedStateFromSession(session: AuthClientSession): AuthSessionState {
  const userId = session?.user?.id;
  if (typeof userId === 'string' && userId.length > 0) {
    return { status: 'authenticated', userId };
  }

  return { status: 'unauthenticated' };
}

function syncAutoRefresh(appState: string, authClient: AuthClientLike): void {
  if (appState === 'active') {
    authClient.auth.startAutoRefresh();
    return;
  }

  authClient.auth.stopAutoRefresh();
}

function handleAppStateChange(next: string | AppStateStatus): void {
  if (client === null) {
    return;
  }

  syncAutoRefresh(next, client);
}

async function clearPartialSession(): Promise<void> {
  if (client === null) {
    return;
  }

  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Clearing a failed apply must not throw tokens or leave authenticated.
  }
}

export function getAuthSessionSnapshot(): AuthSessionState {
  return state;
}

export function subscribeAuthSession(listener: () => void): () => void {
  ensureAuthSessionStarted();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startAuthSession(
  options: StartAuthSessionOptions = {},
): AuthSessionState {
  if (started) {
    return state;
  }

  started = true;
  client = options.client === undefined ? getSharedSupabaseClient() : options.client;

  if (client === null) {
    publishConfirmed({ status: 'unavailable' });
    return state;
  }

  const appState = options.appState ?? AppState;
  const authClient = client;

  const { data } = authClient.auth.onAuthStateChange((_event, session) => {
    publishConfirmed(confirmedStateFromSession(session));
  });
  authSubscription = data.subscription;

  appStateSubscription = appState.addEventListener('change', handleAppStateChange);
  syncAutoRefresh(appState.currentState, authClient);

  return state;
}

export function ensureAuthSessionStarted(): AuthSessionState {
  if (started) {
    return state;
  }

  return startAuthSession();
}

export async function applySession(
  tokens: ApplySessionTokens,
): Promise<ApplySessionResult> {
  if (client === null) {
    return { status: 'failed' };
  }

  let result: {
    data: { session: AuthClientSession };
    error: { message: string } | null;
  };

  try {
    result = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  } catch {
    await clearPartialSession();
    return { status: 'failed' };
  }

  const confirmed = confirmedStateFromSession(result.data.session);
  if (result.error !== null || confirmed.status !== 'authenticated') {
    await clearPartialSession();
    return { status: 'failed' };
  }

  publishConfirmed(confirmed);
  return { status: 'authenticated', userId: confirmed.userId };
}

export async function signOut(): Promise<SignOutResult> {
  if (client === null) {
    return { status: 'failed' };
  }

  let error: { message: string } | null = null;

  try {
    const result = await client.auth.signOut({ scope: 'local' });
    error = result.error;
  } catch {
    error = { message: 'sign_out_failed' };
  }

  if (error !== null) {
    let remaining: AuthClientSession = null;
    try {
      remaining = (await client.auth.getSession()).data.session;
    } catch {
      remaining = null;
    }

    if (confirmedStateFromSession(remaining).status === 'authenticated') {
      return { status: 'failed' };
    }
  }

  publishConfirmed({ status: 'unauthenticated' });
  return { status: 'unauthenticated' };
}

export function resetAuthSessionForTests(): void {
  authSubscription?.unsubscribe();
  authSubscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  listeners.clear();
  client = null;
  started = false;
  state = { status: 'loading' };
}
