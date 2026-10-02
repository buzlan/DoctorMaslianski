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
