/**
 * TEMPORARY DEV-ONLY helper. Do not call from production UI.
 * Clears local auth/session/outbox state so invite activation can be retested
 * from the clinic access screen. Does not touch hosted Supabase rows.
 */

import { clearPendingInviteToken } from '@/modules/invite';

import { getSharedSupabaseClient } from '../supabase/client';
import { clearRemoteUserScopedCaches } from '../runtime/remote-adapters';

import {
  getAuthSessionSnapshot,
  publishLocalUnauthenticated,
  signOut,
} from './auth-session';
import { readSupabaseAuthStorageKey } from './read-supabase-auth-storage-key';
import { removeAuthSessionStorageKeys } from './session-storage';
import {
  getSharedRemotePatientContextResolver,
  resetSharedRemotePatientContextResolver,
} from './shared-remote-patient-context';

export type ResetLocalPatientSessionResult =
  | { status: 'cleared' }
  | { status: 'ignored' };

export type ResetLocalPatientSessionDeps = {
  isDev?: boolean;
  signOutSession?: typeof signOut;
  getClient?: typeof getSharedSupabaseClient;
  readStorageKey?: typeof readSupabaseAuthStorageKey;
  removeAuthStorageKeys?: typeof removeAuthSessionStorageKeys;
  getResolver?: typeof getSharedRemotePatientContextResolver;
  resetResolver?: typeof resetSharedRemotePatientContextResolver;
  clearRemoteCaches?: typeof clearRemoteUserScopedCaches;
  clearPending?: typeof clearPendingInviteToken;
  readAuth?: typeof getAuthSessionSnapshot;
  publishUnauthenticated?: typeof publishLocalUnauthenticated;
};

export async function resetLocalPatientSession(
  deps: ResetLocalPatientSessionDeps = {},
): Promise<ResetLocalPatientSessionResult> {
  const isDev = deps.isDev ?? __DEV__;
  if (!isDev) {
    return { status: 'ignored' };
  }

  const getClient = deps.getClient ?? getSharedSupabaseClient;
  const readStorageKey = deps.readStorageKey ?? readSupabaseAuthStorageKey;
  const client = getClient();
  const baseKey = client === null ? null : readStorageKey(client);

  const getResolver = deps.getResolver ?? getSharedRemotePatientContextResolver;
  getResolver()?.invalidate();
  const resetResolver = deps.resetResolver ?? resetSharedRemotePatientContextResolver;
  resetResolver();

  const clearRemoteCaches = deps.clearRemoteCaches ?? clearRemoteUserScopedCaches;
  await clearRemoteCaches();

  const signOutSession = deps.signOutSession ?? signOut;
  await signOutSession();

  if (baseKey !== null) {
    const remove = deps.removeAuthStorageKeys ?? removeAuthSessionStorageKeys;
    await remove(baseKey);
  }

  const clearPending = deps.clearPending ?? clearPendingInviteToken;
  clearPending();

  const readAuth = deps.readAuth ?? getAuthSessionSnapshot;
  if (readAuth().status === 'authenticated') {
    const publish = deps.publishUnauthenticated ?? publishLocalUnauthenticated;
    publish();
  }

  return { status: 'cleared' };
}
