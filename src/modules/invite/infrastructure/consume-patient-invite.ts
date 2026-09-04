import type { AppSupabaseClient } from '@/core/supabase/client';

import { PILOT_CONSENT_DOCUMENT_VERSION } from '../domain';
import type { InviteConsumeError, InviteSessionTokens } from '../domain';

export type ConsumePatientInviteResult =
  | { status: 'ok'; tokens: InviteSessionTokens }
  | { status: 'error'; error: InviteConsumeError };

export type ConsumePatientInviteInput = {
  token: string;
  privacyAccepted: boolean;
  pilotConsentAccepted: boolean;
};

type ConsumeClient = {
  functions: {
    invoke(
      name: string,
      args: { body: Record<string, unknown> },
    ): Promise<{
      data: unknown;
      error: { message: string; context?: { json?: () => Promise<unknown> } } | null;
    }>;
  };
};

const CONSUME_ERRORS = new Set<InviteConsumeError>([
  'invalid',
  'expired',
  'revoked',
  'consumed',
  'unusable',
  'network',
]);

function asConsumeError(value: unknown): InviteConsumeError | null {
  if (typeof value !== 'string' || !CONSUME_ERRORS.has(value as InviteConsumeError)) {
    return null;
  }
  return value as InviteConsumeError;
}

function asTokens(data: unknown): InviteSessionTokens | null {
  if (data === null || typeof data !== 'object') {
    return null;
  }
  const record = data as { access_token?: unknown; refresh_token?: unknown };
  if (
    typeof record.access_token !== 'string' ||
    record.access_token.length === 0 ||
    typeof record.refresh_token !== 'string' ||
    record.refresh_token.length === 0
  ) {
    return null;
  }
  return {
    accessToken: record.access_token,
    refreshToken: record.refresh_token,
  };
}

export async function consumePatientInvite(
  client: ConsumeClient | AppSupabaseClient,
  input: ConsumePatientInviteInput,
): Promise<ConsumePatientInviteResult> {
  let data: unknown;
  let error: { message: string; context?: { json?: () => Promise<unknown> } } | null;

  try {
    const result = await client.functions.invoke('consume-patient-invite', {
      body: {
        token: input.token,
        privacyAccepted: input.privacyAccepted,
        pilotConsentAccepted: input.pilotConsentAccepted,
        consentDocumentVersion: PILOT_CONSENT_DOCUMENT_VERSION,
      },
    });
    data = result.data;
    error = result.error;
  } catch {
    return { status: 'error', error: 'network' };
  }

  if (error !== null) {
    if (typeof error.context?.json === 'function') {
      try {
        const body = await error.context.json();
        const code = asConsumeError(
          body !== null && typeof body === 'object'
            ? (body as { error?: unknown }).error
            : null,
        );
        if (code !== null && code !== 'network') {
          return { status: 'error', error: code };
        }
      } catch {
        return { status: 'error', error: 'network' };
      }
    }
    return { status: 'error', error: 'network' };
  }

  const tokens = asTokens(data);
  if (tokens === null) {
    const code = asConsumeError(
      data !== null && typeof data === 'object'
        ? (data as { error?: unknown }).error
        : null,
    );
    return { status: 'error', error: code ?? 'unusable' };
  }

  return { status: 'ok', tokens };
}
