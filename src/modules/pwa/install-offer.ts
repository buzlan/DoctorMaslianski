const DISMISS_KEY = "dm.pwa.installConfirmed";
const SNOOZE_KEY = "dm.pwa.installSnoozedUntil";
export const INSTALL_OFFER_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export type InstallDismissStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function readInstallDismissed(
  storage: InstallDismissStorage | null,
  now = Date.now(),
): boolean {
  if (storage === null) {
    return false;
  }
  try {
    if (storage.getItem(DISMISS_KEY) === "1") {
      return true;
    }
    const until = Number(storage.getItem(SNOOZE_KEY));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

export function snoozeInstallOffer(
  storage: InstallDismissStorage | null,
  now = Date.now(),
): void {
  try {
    storage?.setItem(SNOOZE_KEY, String(now + INSTALL_OFFER_SNOOZE_MS));
  } catch {}
}

export function writeInstallDismissed(
  storage: InstallDismissStorage | null,
): void {
  if (storage === null) {
    return;
  }
  try {
    storage.setItem(DISMISS_KEY, "1");
  } catch {
    // A blocked storage write only keeps the offer visible.
  }
}

export function shouldShowHomeScreenInstallOffer(input: {
  web: boolean;
  installed: boolean;
  dismissed: boolean;
  todayStable: boolean;
}): boolean {
  return input.web && input.todayStable && !input.installed && !input.dismissed;
}

export function isIosBrowser(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return true;
  }
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export function isIosSafari(userAgent: string, maxTouchPoints = 0): boolean {
  if (!isIosBrowser(userAgent, maxTouchPoints)) {
    return false;
  }
  return (
    /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)
  );
}
