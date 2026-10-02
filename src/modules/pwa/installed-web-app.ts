export type InstalledWebAppSignals = {
  displayModeStandalone: boolean;
  iosNavigatorStandalone: boolean;
};

export function readInstalledWebAppSignals(): InstalledWebAppSignals {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { displayModeStandalone: false, iosNavigatorStandalone: false };
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  let displayModeStandalone = false;
  try {
    displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    displayModeStandalone = false;
  }

  return {
    displayModeStandalone,
    iosNavigatorStandalone: nav.standalone === true,
  };
}

export function isRunningAsInstalledWebApp(
  signals: InstalledWebAppSignals = readInstalledWebAppSignals(),
): boolean {
  return signals.displayModeStandalone || signals.iosNavigatorStandalone;
}
