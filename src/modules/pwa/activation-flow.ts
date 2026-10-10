import { copy } from '@/shared/copy';

import { isIosBrowser, isIosSafari } from './install-offer';

const ACTIVATION_HOME_KEY = 'dm.pwa.activationHome';

const IN_APP_WEBVIEW =
  /Instagram|FBAN|FBAV|FB_IAB|FB4A|Line\/|MicroMessenger|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|GSA\/|Pinterest|LinkedInApp|WhatsApp|Telegram/i;

export type IosHomeScreenGuide = 'safari' | 'chrome' | 'share' | 'fallback';

export type ActivationFlagStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function iosHomeScreenGuide(
  userAgent: string,
  maxTouchPoints = 0,
): IosHomeScreenGuide | null {
  if (!isIosBrowser(userAgent, maxTouchPoints)) {
    return null;
  }
  if (IN_APP_WEBVIEW.test(userAgent)) {
    return 'fallback';
  }
  if (isIosSafari(userAgent, maxTouchPoints)) {
    return 'safari';
  }
  if (/CriOS/i.test(userAgent)) {
    return 'chrome';
  }
  return 'share';
}

export function canAddToHomeScreen(
  guide: IosHomeScreenGuide | null,
): guide is Exclude<IosHomeScreenGuide, 'fallback'> {
  return guide === 'safari' || guide === 'chrome' || guide === 'share';
}

export function shouldDeferInviteToSafari(userAgent: string, maxTouchPoints = 0): boolean {
  return iosHomeScreenGuide(userAgent, maxTouchPoints) === 'fallback';
}

export function shouldOfferActivationHomeScreen(input: {
  web: boolean;
  guide: IosHomeScreenGuide | null;
  installed: boolean;
}): boolean {
  return input.web && !input.installed && canAddToHomeScreen(input.guide);
}

export function homeScreenInstallSteps(guide: Exclude<IosHomeScreenGuide, 'fallback'>): readonly string[] {
  if (guide === 'chrome') {
    return copy.pwa.chromeSteps;
  }
  if (guide === 'share') {
    return copy.pwa.shareSteps;
  }
  return copy.pwa.iosSteps;
}

export function currentHomeScreenInstallSteps(userAgent: string, maxTouchPoints = 0): readonly string[] {
  const guide = iosHomeScreenGuide(userAgent, maxTouchPoints);
  if (!canAddToHomeScreen(guide)) {
    return copy.pwa.iosSteps;
  }
  return homeScreenInstallSteps(guide);
}

export function inviteLinkForCopy(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!/^\/invite\/[^/]+$/.test(url.pathname)) {
    return null;
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function readActivationHomeFlag(storage: ActivationFlagStorage | null): boolean {
  if (storage === null) {
    return false;
  }
  try {
    return storage.getItem(ACTIVATION_HOME_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeActivationHomeFlag(storage: ActivationFlagStorage | null): void {
  try {
    storage?.setItem(ACTIVATION_HOME_KEY, '1');
  } catch {
    // The success screen stays hidden if storage is blocked.
  }
}

export function clearActivationHomeFlag(storage: ActivationFlagStorage | null): void {
  try {
    storage?.removeItem(ACTIVATION_HOME_KEY);
  } catch {
    // Leaving the flag set only keeps the success screen visible.
  }
}

export function browserSessionStorage(): ActivationFlagStorage | null {
  try {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage;
  } catch {
    return null;
  }
}
