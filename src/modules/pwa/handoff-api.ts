import type { ApplySessionTokens } from '@/core/auth/auth-session';

import { HANDOFF_TOKEN_PATTERN } from './handoff-cookie';

export type HandoffInvokeError = {
  context?: {
    json?: () => Promise<unknown>;
    status?: number;
  };
};

export type HandoffInvokeClient = {
  functions: {
    invoke(
      name: string,
      args: { body: Record<string, unknown> },
    ): Promise<{ data: unknown; error: HandoffInvokeError | null }>;
  };
};

export type CreateHandoffResult = { status: 'ok'; token: string } | { status: 'failed' };

export type ConsumeHandoffResult =
  | { status: 'ok'; tokens: ApplySessionTokens }
  | { status: 'rejected' }
  | { status: 'retryable' };

const REJECTED = new Set(['invalid', 'expired', 'consumed', 'unusable']);

function asToken(data: unknown): string | null {
  if (data === null || typeof data !== 'object') {
    return null;
  }
  const token = (data as { token?: unknown }).token;
  if (typeof token !== 'string' || !HANDOFF_TOKEN_PATTERN.test(token)) {
    return null;
  }
  return token;
}

function asTokens(data: unknown): ApplySessionTokens | null {
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

async function readErrorCode(error: HandoffInvokeError): Promise<string | null> {
  if (typeof error.context?.json !== 'function') {
    return null;
  }
  try {
    const body = await error.context.json();
    if (body === null || typeof body !== 'object') {
      return null;
    }
    const code = (body as { error?: unknown }).error;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}

export async function createWebSessionHandoff(
  client: HandoffInvokeClient,
): Promise<CreateHandoffResult> {
  try {
    const result = await client.functions.invoke('create-web-session-handoff', { body: {} });
    if (result.error !== null) {
      return { status: 'failed' };
    }
    const token = asToken(result.data);
    if (token === null) {
      return { status: 'failed' };
    }
    return { status: 'ok', token };
  } catch {
    return { status: 'failed' };
  }
}

export async function consumeWebSessionHandoff(
  client: HandoffInvokeClient,
  token: string,
): Promise<ConsumeHandoffResult> {
  if (!HANDOFF_TOKEN_PATTERN.test(token)) {
    return { status: 'rejected' };
  }

  let data: unknown;
  let error: HandoffInvokeError | null;
  try {
    const result = await client.functions.invoke('consume-web-session-handoff', {
      body: { token },
    });
    data = result.data;
    error = result.error;
  } catch {
    return { status: 'retryable' };
  }

  if (error !== null) {
    const status = error.context?.status;
    if (status === undefined) {
      return { status: 'retryable' };
    }
    const code = await readErrorCode(error);
    if (code !== null && REJECTED.has(code)) {
      return { status: 'rejected' };
    }
    if (status >= 500) {
      return { status: 'retryable' };
    }
    return { status: 'rejected' };
  }

  const tokens = asTokens(data);
  if (tokens === null) {
    return { status: 'rejected' };
  }
  return { status: 'ok', tokens };
}
