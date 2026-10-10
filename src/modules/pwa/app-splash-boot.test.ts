import { theme } from '@/shared/theme';

import {
  consumeAppSplash,
  isAppSplashConsumed,
  isInitialSplashBootstrapPending,
  resetAppSplashForTests,
  SPLASH_FADE_MS,
  SPLASH_MIN_VISIBLE_MS,
  splashHoldRemainingMs,
} from './app-splash-boot';
import { planInstalledSessionRestore, resolveInstalledGatePhase } from './restore-plan';

declare const require: (id: string) => {
  readFileSync(path: string, encoding: string): string;
  readlinkSync(path: string): string;
  join(...parts: string[]): string;
};
declare const __dirname: string;

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '../../..');
const token = 'a'.repeat(43);

function pending(input: {
  web?: boolean;
  fontsReady?: boolean;
  authStatus?: 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable';
  gatePhase?: 'checking' | 'ready' | 'failed';
  clinicalRoutePending?: boolean;
}): boolean {
  return isInitialSplashBootstrapPending({
    web: input.web ?? true,
    fontsReady: input.fontsReady ?? true,
    authStatus: input.authStatus ?? 'authenticated',
    gatePhase: input.gatePhase ?? 'ready',
    clinicalRoutePending: input.clinicalRoutePending ?? false,
  });
}

describe('branded splash boot', () => {
  afterEach(() => {
    resetAppSplashForTests();
  });

  it('uses the existing splash asset, contain, and the light app background', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/modules/pwa/presentation/app-splash.tsx'),
      'utf8',
    );
    const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
    expect(source).toContain('assets/images/patient/splash_screen.png');
    expect(source).toContain('resizeMode="contain"');
    expect(source).not.toContain('resizeMode="cover"');
    expect(source).not.toContain('background-size');
    expect(source).not.toContain('scale');
    expect(source).not.toContain('prefers-color-scheme');
    expect(source).toContain('theme.colors.light.background');
    expect(html).toContain('id="boot-splash"');
    expect(html).toContain('src="/splash-screen.png"');
    expect(html).toContain('object-fit: contain');
    expect(html).not.toContain('background-size');
    expect(html).not.toContain('prefers-color-scheme');
    expect(fs.readlinkSync(path.join(root, 'public/splash-screen.png'))).toBe(
      '../assets/images/patient/splash_screen.png',
    );
    expect(theme.colors.light.background).toBe('#F5F8FB');
  });

  it('holds a fast boot briefly, then fades without a multi-second delay', () => {
    expect(SPLASH_MIN_VISIBLE_MS).toBeGreaterThanOrEqual(300);
    expect(SPLASH_MIN_VISIBLE_MS).toBeLessThanOrEqual(500);
    expect(SPLASH_FADE_MS).toBeGreaterThanOrEqual(200);
    expect(SPLASH_FADE_MS).toBeLessThanOrEqual(300);
    expect(splashHoldRemainingMs(0)).toBe(SPLASH_MIN_VISIBLE_MS);
    expect(splashHoldRemainingMs(120)).toBe(SPLASH_MIN_VISIBLE_MS - 120);
    expect(splashHoldRemainingMs(SPLASH_MIN_VISIBLE_MS)).toBe(0);
    expect(splashHoldRemainingMs(2_000)).toBe(0);
  });

  it('keeps the splash through a cold launch until fonts, session, and route are ready', () => {
    expect(pending({ fontsReady: false, authStatus: 'loading', gatePhase: 'checking' })).toBe(
      true,
    );
    expect(pending({ authStatus: 'loading', gatePhase: 'checking' })).toBe(true);
    expect(pending({ authStatus: 'authenticated', clinicalRoutePending: true })).toBe(true);
    expect(pending({ authStatus: 'authenticated', clinicalRoutePending: false })).toBe(false);
  });

  it('keeps the splash for an existing session until the clinical route is ready', () => {
    expect(pending({ authStatus: 'authenticated', gatePhase: 'ready', clinicalRoutePending: true })).toBe(
      true,
    );
    expect(pending({ authStatus: 'authenticated', gatePhase: 'ready' })).toBe(false);
  });

  it('keeps the splash through the first installed handoff, including setSession', () => {
    const waiting = planInstalledSessionRestore({
      installed: true,
      authStatus: 'loading',
      handoffToken: token,
    });
    expect(resolveInstalledGatePhase(waiting, 'pending')).toBe('checking');
    expect(pending({ authStatus: 'loading', gatePhase: 'checking' })).toBe(true);

    const consuming = planInstalledSessionRestore({
      installed: true,
      authStatus: 'unauthenticated',
      handoffToken: token,
    });
    expect(consuming).toEqual({ type: 'consume', token });
    expect(resolveInstalledGatePhase(consuming, 'pending')).toBe('checking');
    expect(
      pending({ authStatus: 'unauthenticated', gatePhase: 'checking', clinicalRoutePending: false }),
    ).toBe(true);

    const restored = planInstalledSessionRestore({
      installed: true,
      authStatus: 'authenticated',
      handoffToken: token,
    });
    expect(resolveInstalledGatePhase(restored, 'ready')).toBe('ready');
    expect(pending({ authStatus: 'authenticated', gatePhase: 'ready', clinicalRoutePending: true })).toBe(
      true,
    );
    expect(pending({ authStatus: 'authenticated', gatePhase: 'ready' })).toBe(false);
  });

  it('releases the splash after a controlled handoff or session failure', () => {
    const missing = planInstalledSessionRestore({
      installed: true,
      authStatus: 'unauthenticated',
      handoffToken: null,
    });
    expect(resolveInstalledGatePhase(missing, 'pending')).toBe('failed');
    expect(pending({ authStatus: 'unauthenticated', gatePhase: 'failed' })).toBe(false);

    const consume = planInstalledSessionRestore({
      installed: true,
      authStatus: 'unauthenticated',
      handoffToken: token,
    });
    expect(resolveInstalledGatePhase(consume, 'failed')).toBe('failed');
    expect(pending({ authStatus: 'unauthenticated', gatePhase: 'failed' })).toBe(false);
    expect(pending({ authStatus: 'unavailable', gatePhase: 'ready' })).toBe(false);
  });

  it('shows the same web splash in the browser and on Android or iOS installed PWAs', () => {
    const browser = planInstalledSessionRestore({
      installed: false,
      authStatus: 'loading',
      handoffToken: null,
    });
    expect(resolveInstalledGatePhase(browser, 'pending')).toBe('ready');
    expect(pending({ web: true, authStatus: 'loading', gatePhase: 'ready' })).toBe(true);
    expect(pending({ web: true, authStatus: 'unauthenticated', gatePhase: 'ready' })).toBe(false);
    expect(pending({ web: true, authStatus: 'authenticated', clinicalRoutePending: true })).toBe(
      true,
    );
    expect(pending({ web: false, authStatus: 'loading', gatePhase: 'checking' })).toBe(false);
  });

  it('stays dismissed after the first boot so later navigation does not replay it', () => {
    expect(isAppSplashConsumed()).toBe(false);
    consumeAppSplash();
    expect(isAppSplashConsumed()).toBe(true);
  });
});
