import type { InstalledAuthStatus, InstalledGatePhase } from './restore-plan';

/** Shortest time the branded splash stays up when bootstrap finishes quickly. */
export const SPLASH_MIN_VISIBLE_MS = 400;

/** Fade from the branded splash into the resolved screen. */
export const SPLASH_FADE_MS = 250;

let appSplashConsumed = false;

export function isAppSplashConsumed(): boolean {
  return appSplashConsumed;
}

export function consumeAppSplash(): void {
  appSplashConsumed = true;
}

export function resetAppSplashForTests(): void {
  appSplashConsumed = false;
}

export function splashHoldRemainingMs(
  elapsedMs: number,
  minVisibleMs = SPLASH_MIN_VISIBLE_MS,
): number {
  if (elapsedMs >= minVisibleMs) {
    return 0;
  }
  return minVisibleMs - elapsedMs;
}

/**
 * Initial web/PWA boot only: fonts, auth/session restore, installed handoff,
 * and the first clinical route. Later navigation does not call this again
 * after the splash has been consumed.
 */
export function isInitialSplashBootstrapPending(input: {
  web: boolean;
  fontsReady: boolean;
  authStatus: InstalledAuthStatus;
  gatePhase: InstalledGatePhase;
  clinicalRoutePending: boolean;
}): boolean {
  if (!input.web) {
    return false;
  }
  if (!input.fontsReady) {
    return true;
  }
  if (input.authStatus === 'loading') {
    return true;
  }
  if (input.gatePhase === 'checking') {
    return true;
  }
  if (input.clinicalRoutePending) {
    return true;
  }
  return false;
}
