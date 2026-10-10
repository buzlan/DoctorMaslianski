const DISMISS_KEY = 'dm.notifications.onboardingDismissed';

export type OnboardingStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function readNotificationOnboardingDismissed(storage: OnboardingStorage | null): boolean {
  if (storage === null) {
    return false;
  }
  try {
    return storage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissNotificationOnboarding(storage: OnboardingStorage | null): void {
  try {
    storage?.setItem(DISMISS_KEY, '1');
  } catch {
    // A blocked write only shows the prompt again next time.
  }
}
