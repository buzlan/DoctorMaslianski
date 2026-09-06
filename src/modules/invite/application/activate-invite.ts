import { applySession, signOut } from '@/core/auth/auth-session';
import {
  getSharedRemotePatientContextResolver,
} from '@/core/auth/shared-remote-patient-context';
import { getSharedSupabaseClient } from '@/core/supabase/client';

import {
  clearPendingInviteToken,
  getPendingInviteToken,
} from './pending-invite-token';
import { consumePatientInvite } from '../infrastructure/consume-patient-invite';
import type { InviteConsumeError } from '../domain';

export type ActivateInviteResult =
  | { status: 'activated' }
  | { status: 'error'; error: InviteConsumeError };

export type ActivateInviteDeps = {
  consume?: typeof consumePatientInvite;
  apply?: typeof applySession;
  signOutSession?: typeof signOut;
  getClient?: typeof getSharedSupabaseClient;
  getResolver?: typeof getSharedRemotePatientContextResolver;
  readPending?: typeof getPendingInviteToken;
  clearPending?: typeof clearPendingInviteToken;
};

export async function activatePendingInvite(
  input: {
    privacyAccepted: boolean;
    pilotConsentAccepted: boolean;
  },
  deps: ActivateInviteDeps = {},
): Promise<ActivateInviteResult> {
  if (!input.privacyAccepted || !input.pilotConsentAccepted) {
    return { status: 'error', error: 'unusable' };
  }

  const readPending = deps.readPending ?? getPendingInviteToken;
  const token = readPending();
  if (token === null) {
    return { status: 'error', error: 'invalid' };
  }

  const getClient = deps.getClient ?? getSharedSupabaseClient;
  const client = getClient();
  if (client === null) {
    return { status: 'error', error: 'service' };
  }

  const consume = deps.consume ?? consumePatientInvite;
  const consumed = await consume(client, {
    token,
    privacyAccepted: input.privacyAccepted,
    pilotConsentAccepted: input.pilotConsentAccepted,
  });

  if (consumed.status === 'error') {
    return consumed;
  }

  const apply = deps.apply ?? applySession;
  const applied = await apply(consumed.tokens);
  if (applied.status !== 'authenticated') {
    return { status: 'error', error: 'unusable' };
  }

  const getResolver = deps.getResolver ?? getSharedRemotePatientContextResolver;
  const resolver = getResolver();
  resolver?.invalidate();
  const context = resolver === null ? { status: 'unlinked' as const } : await resolver.resolve();

  if (context.status !== 'ready') {
    const signOutSession = deps.signOutSession ?? signOut;
    await signOutSession();
    return { status: 'error', error: 'unusable' };
  }

  const clearPending = deps.clearPending ?? clearPendingInviteToken;
  clearPending();
  return { status: 'activated' };
}
