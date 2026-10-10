export type InstalledAuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'unavailable';

export type InstalledRestorePlan =
  | { type: 'wait' }
  | { type: 'skip' }
  | { type: 'consume'; token: string }
  | { type: 'missing' };

export function planInstalledSessionRestore(input: {
  installed: boolean;
  authStatus: InstalledAuthStatus;
  handoffToken: string | null;
}): InstalledRestorePlan {
  if (!input.installed) {
    return { type: 'skip' };
  }
  if (input.authStatus === 'loading') {
    return { type: 'wait' };
  }
  if (input.authStatus === 'authenticated' || input.authStatus === 'unavailable') {
    return { type: 'skip' };
  }
  if (input.handoffToken === null) {
    return { type: 'missing' };
  }
  return { type: 'consume', token: input.handoffToken };
}

export type InstalledGatePhase = 'checking' | 'ready' | 'failed';

export function resolveInstalledGatePhase(
  plan: InstalledRestorePlan,
  consumePhase: 'pending' | 'ready' | 'failed',
): InstalledGatePhase {
  if (plan.type === 'wait' || (plan.type === 'consume' && consumePhase === 'pending')) {
    return 'checking';
  }
  if (plan.type === 'missing' || (plan.type === 'consume' && consumePhase === 'failed')) {
    return 'failed';
  }
  return 'ready';
}
