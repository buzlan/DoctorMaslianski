import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActivityIndicator, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { browserSessionStorage, readActivationHomeFlag } from '@/modules/pwa/activation-flow';
import { isIosBrowser, readInstallDismissed, shouldShowHomeScreenInstallOffer } from '@/modules/pwa/install-offer';
import { isRunningAsInstalledWebApp } from '@/modules/pwa/installed-web-app';
import { copy } from '@/shared/copy';
import { theme } from '@/shared/theme';
import { AppText, Button, Card, Stack } from '@/shared/ui';

import { isAndroidBrowser, shouldShowNotificationOnboarding, type BrowserNotificationPermission } from '../capability';
import { dismissNotificationOnboarding, readNotificationOnboardingDismissed } from '../onboarding-storage';
import { recordExistingBrowserPushSubscription, syncBrowserPushSubscription } from '../push-api';
import { completeNotificationEnable } from '../reminders';

function browserStore(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window[kind];
  } catch {
    return null;
  }
}

function readPermission(): BrowserNotificationPermission {
  if (typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function NotificationOnboarding() {
  const storage = browserStore('sessionStorage');
  const [dismissed, setDismissed] = useState(() => readNotificationOnboardingDismissed(storage));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(() => readPermission() !== 'granted');

  const web = Platform.OS === 'web' && typeof navigator !== 'undefined';
  const userAgent = web ? navigator.userAgent : '';
  const touchPoints = web ? navigator.maxTouchPoints : 0;
  const ios = isIosBrowser(userAgent, touchPoints);
  const android = isAndroidBrowser(userAgent);
  const standalone = web && isRunningAsInstalledWebApp();
  const supported = web && typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  const permission = readPermission();
  const installOfferVisible = shouldShowHomeScreenInstallOffer({
    web,
    installed: standalone,
    dismissed: readInstallDismissed(browserStore('localStorage')),
    todayStable: true,
  });
  const visible =
    !closed &&
    shouldShowNotificationOnboarding({
      web,
      ios,
      android,
      standalone,
      permission,
      dismissed,
      activationPending: readActivationHomeFlag(browserSessionStorage()),
      supported,
      installOfferVisible,
      subscriptionActive,
      subscriptionChecked,
    });

  useEffect(() => {
    if (!visible && permission !== 'granted') {
      return;
    }
    if (permission !== 'granted' || !supported || dismissed || closed) {
      return;
    }
    if (ios && !standalone) {
      return;
    }
    if (!ios && !android) {
      return;
    }
    let cancelled = false;
    void recordExistingBrowserPushSubscription().then((result) => {
      if (cancelled) {
        return;
      }
      setSubscriptionActive(result === 'synced');
      setSubscriptionChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [android, closed, dismissed, ios, permission, standalone, supported, visible]);

  if (!visible || typeof document === 'undefined') {
    return null;
  }

  function finish() {
    setFailed(false);
    setBusy(false);
    setClosed(true);
  }

  async function onContinue() {
    if (busy) {
      return;
    }
    setBusy(true);
    setFailed(false);
    const result = await completeNotificationEnable({
      permission: readPermission(),
      requestPermission: () => Notification.requestPermission(),
      syncSubscription: () => syncBrowserPushSubscription(),
    });
    if (result === 'failed') {
      setBusy(false);
      setFailed(true);
      return;
    }
    if (result === 'enabled') {
      setSubscriptionActive(true);
    }
    finish();
  }

  function onLater() {
    if (busy) {
      return;
    }
    dismissNotificationOnboarding(storage);
    setDismissed(true);
    finish();
  }

  return createPortal(
    <View style={styles.backdrop}>
      <Card style={styles.card}>
        <Stack gap="md">
          <AppText variant="title" accessibilityRole="header">
            {copy.notifications.enableTitle}
          </AppText>
          <AppText tone="secondary">{copy.notifications.enableBody}</AppText>
          {failed ? <AppText tone="secondary">{copy.notifications.enableError}</AppText> : null}
          {busy ? <ActivityIndicator color={theme.colors.light.accent} /> : null}
          <Button
            label={failed ? copy.notifications.retry : copy.notifications.enableAction}
            variant="primary"
            disabled={busy}
            onPress={() => {
              void onContinue();
            }}
          />
          {busy ? null : (
            <Button label={copy.notifications.later} variant="secondary" onPress={onLater} />
          )}
        </Stack>
      </Card>
    </View>,
    document.body,
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    paddingBottom: 96,
    backgroundColor: 'rgba(27, 36, 48, 0.28)',
    zIndex: 70,
  } as ViewStyle,
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
