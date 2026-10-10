import { isIosBrowser } from './install-offer';

export function isHandheld(userAgent: string, maxTouchPoints = 0): boolean {
  return isIosBrowser(userAgent, maxTouchPoints) || /Android/i.test(userAgent);
}

export function shouldBlockLandscape(input: {
  web: boolean;
  landscape: boolean;
  phone: boolean;
}): boolean {
  return input.web && input.landscape && input.phone;
}

export function lockPortrait(
  screenOrientation: { lock?: (orientation: 'portrait') => Promise<void> } | null,
): void {
  if (screenOrientation?.lock === undefined) {
    return;
  }
  void screenOrientation.lock('portrait').catch(() => undefined);
}
