import { copy } from '@/shared/copy';

import {
  canAddToHomeScreen,
  clearActivationHomeFlag,
  homeScreenInstallSteps,
  inviteLinkForCopy,
  iosHomeScreenGuide,
  readActivationHomeFlag,
  shouldDeferInviteToSafari,
  shouldOfferActivationHomeScreen,
  writeActivationHomeFlag,
} from './activation-flow';

const safari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const chrome =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1';
const edge =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/126.0.0.0 Version/17.0 Mobile/15E148 Safari/604.1';
const instagram =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.0.0';

describe('activation home screen', () => {
  it('allows iOS Safari to activate and shows the share steps', () => {
    expect(iosHomeScreenGuide(safari)).toBe('safari');
    expect(canAddToHomeScreen('safari')).toBe(true);
    expect(shouldDeferInviteToSafari(safari)).toBe(false);
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'safari', installed: false })).toBe(
      true,
    );
    expect(homeScreenInstallSteps('safari')).toEqual(copy.pwa.iosSteps);
    expect(copy.pwa.iosSteps[0]).toBe('Нажмите «Поделиться»');
    expect(copy.pwa.iosSteps[1]).toBe('Выберите «На экран Домой»');
  });

  it('allows iOS Chrome to activate and shows the home screen steps', () => {
    expect(iosHomeScreenGuide(chrome)).toBe('chrome');
    expect(canAddToHomeScreen('chrome')).toBe(true);
    expect(shouldDeferInviteToSafari(chrome)).toBe(false);
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'chrome', installed: false })).toBe(
      true,
    );
    expect(homeScreenInstallSteps('chrome')).toEqual(copy.pwa.chromeSteps);
    expect(copy.pwa.chromeSteps[1]).toBe('Выберите «На экран Домой»');
  });

  it('allows iOS Edge and uses the system share steps', () => {
    expect(iosHomeScreenGuide(edge)).toBe('share');
    expect(canAddToHomeScreen('share')).toBe(true);
    expect(shouldDeferInviteToSafari(edge)).toBe(false);
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'share', installed: false })).toBe(
      true,
    );
    expect(homeScreenInstallSteps('share')[0]).toBe('Откройте меню «Поделиться»');
  });

  it('does not show the install prompt in a standalone app', () => {
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'safari', installed: true })).toBe(
      false,
    );
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'chrome', installed: true })).toBe(
      false,
    );
    expect(shouldOfferActivationHomeScreen({ web: true, guide: 'share', installed: true })).toBe(
      false,
    );
  });

  it('falls back to the Safari instruction only when install is unavailable', () => {
    expect(iosHomeScreenGuide(instagram)).toBe('fallback');
    expect(canAddToHomeScreen('fallback')).toBe(false);
    expect(shouldDeferInviteToSafari(instagram)).toBe(true);
    expect(
      shouldOfferActivationHomeScreen({ web: true, guide: 'fallback', installed: false }),
    ).toBe(false);
    expect(copy.pwa.safariTitle).toBe('Откройте эту ссылку в Safari');
    expect(copy.pwa.copyLink).toBe('Скопировать ссылку');
    expect(
      shouldDeferInviteToSafari(
        'Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe(false);
  });

  it('copies only the invite URL and drops any query', () => {
    expect(
      inviteLinkForCopy('https://app.maslianski.by/invite/abc?access_token=secret#handoff'),
    ).toBe('https://app.maslianski.by/invite/abc');
    expect(inviteLinkForCopy('https://app.maslianski.by/access')).toBeNull();
  });

  it('keeps the success screen until the patient continues', () => {
    const items = new Map<string, string>();
    const storage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => {
        items.set(key, value);
      },
      removeItem: (key: string) => {
        items.delete(key);
      },
    };
    expect(readActivationHomeFlag(storage)).toBe(false);
    writeActivationHomeFlag(storage);
    expect(readActivationHomeFlag(storage)).toBe(true);
    clearActivationHomeFlag(storage);
    expect(readActivationHomeFlag(storage)).toBe(false);
  });

  it('keeps implementation words out of the patient copy', () => {
    const values = Object.values({ ...copy.pwa, ...copy.notifications })
      .flat()
      .join(' ')
      .toLowerCase();
    expect(values).not.toContain('pwa');
    expect(values).not.toContain('cookie');
    expect(values).not.toContain('handoff');
    expect(values).not.toContain('service worker');
  });
});
