export function syncAppBadge(count: number): void {
  if (typeof navigator === 'undefined') {
    return;
  }
  const badgeNavigator = navigator as Navigator & {
    setAppBadge?: (value: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  const action = count > 0 ? badgeNavigator.setAppBadge?.(count) : badgeNavigator.clearAppBadge?.();
  void action?.catch(() => undefined);
}
