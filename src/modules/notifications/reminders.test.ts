import {
  isAndroidBrowser,
  notificationPermissionAction,
  reminderUiState,
  shouldShowNotificationOnboarding,
} from './capability';
import { completeNotificationEnable, disablePushSubscription, enableReminders, readVapidPublicKey, subscriptionKeys, syncPushSubscription, vapidPublicKeyToBytes } from './reminders';
import { routeForNotification, routeFromNotificationMessage } from './routes';

const keys = {
  endpoint: 'https://push.example.test/device',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
};

describe('notification permission rules', () => {
  it('asks iOS Safari to install before requesting permission', () => {
    expect(
      notificationPermissionAction({
        supported: true,
        ios: true,
        android: false,
        standalone: false,
        permission: 'default',
      }),
    ).toBe('install');
    expect(
      notificationPermissionAction({
        supported: true,
        ios: true,
        android: false,
        standalone: true,
        permission: 'default',
      }),
    ).toBe('request');
  });

  it('lets Android request permission without an installed app', () => {
    expect(isAndroidBrowser('Mozilla/5.0 (Linux; Android 14)')).toBe(true);
    expect(
      notificationPermissionAction({
        supported: true,
        ios: false,
        android: true,
        standalone: false,
        permission: 'default',
      }),
    ).toBe('request');
  });

  it('does not request permission again after a denial', () => {
    expect(
      notificationPermissionAction({
        supported: true,
        ios: false,
        android: true,
        standalone: true,
        permission: 'denied',
      }),
    ).toBe('denied');
  });

  it('describes the settings state', () => {
    expect(
      reminderUiState({
        supported: true,
        ios: true,
        android: false,
        standalone: false,
        permission: 'default',
        subscriptionActive: false,
      }),
    ).toBe('ios-browser');
    expect(
      reminderUiState({
        supported: true,
        ios: true,
        android: false,
        standalone: true,
        permission: 'granted',
        subscriptionActive: true,
      }),
    ).toBe('enabled');
    expect(
      reminderUiState({
        supported: true,
        ios: false,
        android: true,
        standalone: false,
        permission: 'granted',
        subscriptionActive: false,
      }),
    ).toBe('off');
    expect(
      reminderUiState({
        supported: true,
        ios: false,
        android: true,
        standalone: false,
        permission: 'denied',
        subscriptionActive: false,
      }),
    ).toBe('denied');
    expect(
      reminderUiState({
        supported: false,
        ios: false,
        android: false,
        standalone: false,
        permission: 'unsupported',
        subscriptionActive: false,
      }),
    ).toBe('unsupported');
    expect(
      reminderUiState({
        supported: true,
        ios: false,
        android: true,
        standalone: false,
        permission: 'default',
        subscriptionActive: false,
      }),
    ).toBe('enable');
  });

  it('shows the first reminder prompt only from a user-reachable state', () => {
    expect(
      shouldShowNotificationOnboarding({
        web: true,
        ios: true,
        android: false,
        standalone: true,
        permission: 'default',
        dismissed: false,
        activationPending: false,
        supported: true,
        installOfferVisible: false,
        subscriptionActive: false,
        subscriptionChecked: true,
      }),
    ).toBe(true);
    expect(
      shouldShowNotificationOnboarding({
        web: true,
        ios: true,
        android: false,
        standalone: false,
        permission: 'default',
        dismissed: false,
        activationPending: false,
        supported: true,
        installOfferVisible: false,
        subscriptionActive: false,
        subscriptionChecked: true,
      }),
    ).toBe(false);
  });

  it('shows onboarding for a default permission and hides it after setup', () => {
    const base = {
      web: true,
      ios: true,
      android: false,
      standalone: true,
      dismissed: false,
      activationPending: false,
      supported: true,
      installOfferVisible: false,
      subscriptionChecked: true,
    };
    expect(
      shouldShowNotificationOnboarding({
        ...base,
        permission: 'default',
        subscriptionActive: false,
      }),
    ).toBe(true);
    expect(
      shouldShowNotificationOnboarding({
        ...base,
        permission: 'granted',
        subscriptionActive: true,
      }),
    ).toBe(false);
    expect(
      shouldShowNotificationOnboarding({
        ...base,
        permission: 'granted',
        subscriptionActive: false,
        subscriptionChecked: false,
      }),
    ).toBe(false);
    expect(
      shouldShowNotificationOnboarding({
        ...base,
        permission: 'denied',
        subscriptionActive: false,
      }),
    ).toBe(false);
  });
});

describe('push subscription sync', () => {
  it('reuses an existing subscription', async () => {
    const save = jest.fn(async () => 'ok' as const);
    const subscribe = jest.fn(async () => keys);
    await expect(
      syncPushSubscription({
        getExisting: async () => keys,
        subscribe,
        save,
      }),
    ).resolves.toBe('synced');
    expect(subscribe).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(keys);
  });

  it('creates a subscription when none exists', async () => {
    await expect(
      syncPushSubscription({
        getExisting: async () => null,
        subscribe: async () => keys,
        save: async () => 'ok',
      }),
    ).resolves.toBe('created');
  });

  it('unsubscribes and marks the server subscription disabled', async () => {
    const unsubscribe = jest.fn(async () => undefined);
    const markDisabled = jest.fn(async () => 'ok' as const);
    await expect(disablePushSubscription({ unsubscribe, markDisabled })).resolves.toBe('disabled');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(markDisabled).toHaveBeenCalledTimes(1);
  });

  it('creates and saves a subscription from one granted tap, then closes', async () => {
    const requestPermission = jest.fn(async () => 'granted' as const);
    const subscribe = jest.fn(async () => keys);
    const save = jest.fn(async () => 'ok' as const);
    const synced = await syncPushSubscription({
      getExisting: async () => null,
      subscribe,
      save,
    });
    await expect(
      completeNotificationEnable({
        permission: 'default',
        requestPermission,
        syncSubscription: async () => synced,
      }),
    ).resolves.toBe('enabled');
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(keys);
    expect(
      shouldShowNotificationOnboarding({
        web: true,
        ios: true,
        android: false,
        standalone: true,
        permission: 'granted',
        dismissed: false,
        activationPending: false,
        supported: true,
        installOfferVisible: false,
        subscriptionActive: true,
        subscriptionChecked: true,
      }),
    ).toBe(false);
  });

  it('does not create a second subscription when one already exists', async () => {
    const subscribe = jest.fn(async () => keys);
    const requestPermission = jest.fn(async () => 'granted' as const);
    await expect(
      completeNotificationEnable({
        permission: 'granted',
        requestPermission,
        syncSubscription: () =>
          syncPushSubscription({
            getExisting: async () => keys,
            subscribe,
            save: async () => 'ok',
          }),
      }),
    ).resolves.toBe('enabled');
    expect(requestPermission).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('closes after a denial and does not ask again by itself', async () => {
    const requestPermission = jest.fn(async () => 'denied' as const);
    const syncSubscription = jest.fn(async () => 'created' as const);
    await expect(
      completeNotificationEnable({
        permission: 'default',
        requestPermission,
        syncSubscription,
      }),
    ).resolves.toBe('denied');
    expect(syncSubscription).not.toHaveBeenCalled();
    await expect(
      completeNotificationEnable({
        permission: 'denied',
        requestPermission,
        syncSubscription,
      }),
    ).resolves.toBe('denied');
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('keeps a retry state when saving the subscription fails', async () => {
    await expect(
      completeNotificationEnable({
        permission: 'granted',
        requestPermission: async () => 'granted',
        syncSubscription: async () => 'failed',
      }),
    ).resolves.toBe('failed');
    expect(
      shouldShowNotificationOnboarding({
        web: true,
        ios: true,
        android: false,
        standalone: true,
        permission: 'granted',
        dismissed: false,
        activationPending: false,
        supported: true,
        installOfferVisible: false,
        subscriptionActive: false,
        subscriptionChecked: true,
      }),
    ).toBe(true);
  });

  it('leaves Today without a reminders card', () => {
    const fs = jest.requireActual('fs') as {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
    const source = fs.readFileSync('src/modules/today/presentation/today-screen.tsx', 'utf8');
    expect(source).not.toContain('NotificationSettingsCard');
    expect(source).not.toContain('Напоминания включены');
  });

  it('requests permission only for an explicit enable action', async () => {
    const requestPermission = jest.fn(async () => 'granted' as const);
    await expect(
      enableReminders({
        action: 'install',
        requestPermission,
        syncSubscription: async () => 'created',
      }),
    ).resolves.toBe('install');
    expect(requestPermission).not.toHaveBeenCalled();

    await expect(
      enableReminders({
        action: 'request',
        requestPermission,
        syncSubscription: async () => 'created',
      }),
    ).resolves.toBe('enabled');
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('rejects a private key and reads only a public key', () => {
    expect(subscriptionKeys({ endpoint: 'https://push.example.test/a', keys: { p256dh: 'p256dh-key', auth: 'auth-key' } })?.endpoint).toBe('https://push.example.test/a');
    expect(readVapidPublicKey('BEGIN PRIVATE KEY')).toBeNull();
    expect(vapidPublicKeyToBytes('x'.repeat(87))).not.toBeNull();
  });
});

describe('notification click routes', () => {
  it('maps kinds to safe routes and drops query strings', () => {
    expect(routeForNotification('daily_morning', '/?pain=8')).toBe('/');
    expect(routeForNotification('daily_afternoon', null)).toBe('/');
    expect(routeForNotification('appointment_same_day', '/diary')).toBe('/diary');
    expect(routeForNotification('treatment_updated', null)).toBe('/treatment');
    expect(routeForNotification('treatment_completed', null)).toBe('/');
    expect(routeForNotification('manual_test', null)).toBe('/');
    expect(routeFromNotificationMessage({ type: 'notification-navigate', route: '/treatment' })).toBe('/treatment');
    expect(routeFromNotificationMessage({ type: 'notification-navigate', route: '/diary?token=1' })).toBeNull();
    expect(routeFromNotificationMessage({ type: 'other', route: '/' })).toBeNull();
  });
});
