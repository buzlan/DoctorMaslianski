import type { ApplySessionTokens } from '@/core/auth/auth-session';

import type { ConsumeHandoffResult } from './handoff-api';

export async function restoreInstalledSession(
  token: string,
  deps: {
    consume: (token: string) => Promise<ConsumeHandoffResult>;
    apply: (tokens: ApplySessionTokens) => Promise<{ status: string }>;
  },
): Promise<'restored' | 'rejected' | 'retryable'> {
  const consumed = await deps.consume(token);
  if (consumed.status === 'retryable') {
    return 'retryable';
  }
  if (consumed.status === 'rejected') {
    return 'rejected';
  }

  const applied = await deps.apply(consumed.tokens);
  if (applied.status !== 'authenticated') {
    return 'rejected';
  }
  return 'restored';
}
