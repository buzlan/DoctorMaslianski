import { isRunningAsInstalledWebApp } from './installed-web-app';
import {
  isIosBrowser,
  isIosSafari,
  readInstallDismissed,
  shouldShowHomeScreenInstallOffer,
  writeInstallDismissed,
} from './install-offer';
import { captureBeforeInstallPrompt, completeInstallPrompt, registerPushFoundationWorker, takeInstallPrompt } from './install-prompt';

describe('installed web app detection', () => {
  it('is installed for display-mode standalone or iOS navigator.standalone', () => {
    expect(
      isRunningAsInstalledWebApp({
        displayModeStandalone: true,
        iosNavigatorStandalone: false,
      }),
    ).toBe(true);
    expect(
      isRunningAsInstalledWebApp({
        displayModeStandalone: false,
        iosNavigatorStandalone: true,
      }),
    ).toBe(true);
    expect(
      isRunningAsInstalledWebApp({
        displayModeStandalone: false,
        iosNavigatorStandalone: false,
      }),
    ).toBe(false);
  });
});

describe('home screen install offer', () => {
  it('shows once Today is stable in the browser and hides after dismiss or install', () => {
    expect(
      shouldShowHomeScreenInstallOffer({
        web: true,
        installed: false,
        dismissed: false,
        todayStable: true,
      }),
    ).toBe(true);
    expect(
      shouldShowHomeScreenInstallOffer({
        web: true,
        installed: true,
        dismissed: false,
        todayStable: true,
      }),
    ).toBe(false);
    expect(
      shouldShowHomeScreenInstallOffer({
        web: true,
        installed: false,
        dismissed: true,
        todayStable: true,
      }),
    ).toBe(false);
    expect(
      shouldShowHomeScreenInstallOffer({
        web: true,
        installed: false,
        dismissed: false,
        todayStable: false,
      }),
    ).toBe(false);
    expect(
      shouldShowHomeScreenInstallOffer({
        web: false,
        installed: false,
        dismissed: false,
        todayStable: true,
      }),
    ).toBe(false);
  });

  it('stores dismiss locally', () => {
    const items = new Map<string, string>();
    const storage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => {
        items.set(key, value);
      },
    };
    expect(readInstallDismissed(storage)).toBe(false);
    writeInstallDismissed(storage);
    expect(readInstallDismissed(storage)).toBe(true);
  });

  it('treats iOS Chrome as an iOS browser that is not Safari', () => {
    const chrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) CriOS/126.0.0.0 Mobile Safari/604.1';
    const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    expect(isIosBrowser(chrome)).toBe(true);
    expect(isIosSafari(chrome)).toBe(false);
    expect(isIosSafari(safari)).toBe(true);
  });
});

describe('install prompt capture', () => {
  afterEach(() => {
    takeInstallPrompt();
  });

  it('prevents the automatic prompt and waits for a user action', async () => {
    const registered: { listener: ((event: Event) => void) | null } = { listener: null };
    captureBeforeInstallPrompt({
      addEventListener: (_type, next) => {
        registered.listener = next;
      },
    });
    const preventDefault = jest.fn();
    const prompt = jest.fn(async () => undefined);
    const event = {
      preventDefault,
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    };
    const listener = registered.listener;
    if (listener === null) {
      throw new Error('beforeinstallprompt listener was not registered');
    }
    listener(event as unknown as Event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(prompt).not.toHaveBeenCalled();

    const outcome = await completeInstallPrompt(takeInstallPrompt());
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(outcome).toBe('accepted');
  });

  it('asks for manual steps when the browser has no deferred prompt', async () => {
    expect(await completeInstallPrompt(null)).toBe('manual');
  });

  it('registers the push foundation worker without throwing', () => {
    const register = jest.fn(async () => undefined);
    registerPushFoundationWorker({ serviceWorker: { register } });
    expect(register).toHaveBeenCalledWith('/sw.js');
    expect(() => registerPushFoundationWorker(null)).not.toThrow();
  });
});
