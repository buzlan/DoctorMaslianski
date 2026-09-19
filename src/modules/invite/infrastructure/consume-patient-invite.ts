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

type InvokeErrorContext = {
  json?: () => Promise<unknown>;
  status?: number;
  statusCode?: number;
};

type InvokeError = {
  name?: string;
  message?: string;
  context?: InvokeErrorContext;
};

type ConsumeClient = {
  functions: {
    invoke(
      name: string,
      args: { body: Record<string, unknown> },
    ): Promise<{
      data: unknown;
      error: InvokeError | null;
    }>;
  };
};

const CONTRACT_ERRORS = new Set<InviteConsumeError>([
  'invalid',
  'expired',
  'revoked',
  'consumed',
  'unusable',
]);

function asContractError(value: unknown): InviteConsumeError | null {
  if (typeof value !== 'string' || !CONTRACT_ERRORS.has(value as InviteConsumeError)) {
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

function httpStatus(error: InvokeError): number | null {
  const status = error.context?.status ?? error.context?.statusCode;
  return typeof status === 'number' ? status : null;
}

async function readContractError(error: InvokeError): Promise<InviteConsumeError | null> {
  if (typeof error.context?.json !== 'function') {
    return null;
  }

  try {
    const body = await error.context.json();
    if (body === null || typeof body !== 'object') {
      return null;
    }
    return asContractError((body as { error?: unknown }).error);
  } catch {
    return null;
  }
}

function mapHttpStatus(status: number | null): InviteConsumeError {
  if (status === null) {
    return 'network';
  }
  if (status >= 500 || status === 401 || status === 403) {
    return 'service';
  }
  if (status >= 400) {
    return 'unusable';
  }
  return 'network';
}

async function mapInvokeError(error: InvokeError): Promise<InviteConsumeError> {
  const status = httpStatus(error);
  const code = await readContractError(error);
  if (code === 'unusable' && status !== null && status >= 500) {
    return 'service';
  }
  if (code !== null) {
    return code;
  }
  return mapHttpStatus(status);
}

export async function consumePatientInvite(
  client: ConsumeClient | AppSupabaseClient,
  input: ConsumePatientInviteInput,
): Promise<ConsumePatientInviteResult> {
  let data: unknown;
  let error: InvokeError | null;

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
  } catch (thrown) {
    if (thrown !== null && typeof thrown === 'object') {
      return { status: 'error', error: await mapInvokeError(thrown as InvokeError) };
    }
    return { status: 'error', error: 'network' };
  }

  if (error !== null) {
    return { status: 'error', error: await mapInvokeError(error) };
  }

  const tokens = asTokens(data);
  if (tokens === null) {
    const code = asContractError(
      data !== null && typeof data === 'object'
        ? (data as { error?: unknown }).error
        : null,
    );
    return { status: 'error', error: code ?? 'unusable' };
  }

  return { status: 'ok', tokens };
}
