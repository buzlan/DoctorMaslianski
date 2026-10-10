export type BrowserNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export type NotificationPermissionAction = 'request' | 'install' | 'denied' | 'unsupported' | 'already';

export type ReminderUiState = 'enabled' | 'enable' | 'denied' | 'ios-browser' | 'unsupported' | 'off';

export function isAndroidBrowser(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

export function notificationPermissionAction(input: {
  supported: boolean;
  ios: boolean;
  android: boolean;
  standalone: boolean;
  permission: BrowserNotificationPermission;
}): NotificationPermissionAction {
  if (!input.supported || input.permission === 'unsupported') {
    return 'unsupported';
  }
  if (input.ios && !input.standalone) {
    return 'install';
  }
  if (input.permission === 'denied') {
    return 'denied';
  }
  if (input.permission === 'granted') {
    return 'already';
  }
  if ((input.ios && input.standalone) || input.android) {
    return 'request';
  }
  return 'unsupported';
}

export function reminderUiState(input: {
  supported: boolean;
  ios: boolean;
  android: boolean;
  standalone: boolean;
  permission: BrowserNotificationPermission;
  subscriptionActive: boolean;
}): ReminderUiState {
  if (input.ios && !input.standalone) {
    return 'ios-browser';
  }
  if (!input.supported || input.permission === 'unsupported') {
    return 'unsupported';
  }
  if (input.permission === 'denied') {
    return 'denied';
  }
  if (input.permission === 'granted' && input.subscriptionActive) {
    return 'enabled';
  }
  if (input.permission === 'granted') {
    return 'off';
  }
  if ((input.ios && input.standalone) || input.android) {
    return 'enable';
  }
  return 'unsupported';
}

export function shouldShowNotificationOnboarding(input: {
  web: boolean;
  ios: boolean;
  android: boolean;
  standalone: boolean;
  permission: BrowserNotificationPermission;
  dismissed: boolean;
  activationPending: boolean;
  supported: boolean;
  installOfferVisible: boolean;
  subscriptionActive: boolean;
  subscriptionChecked: boolean;
}): boolean {
  if (!input.web || input.dismissed || input.activationPending || !input.supported) {
    return false;
  }
  if (input.permission === 'denied' || input.permission === 'unsupported') {
    return false;
  }
  if (input.permission === 'granted' && (!input.subscriptionChecked || input.subscriptionActive)) {
    return false;
  }
  if (input.ios) {
    return input.standalone;
  }
  if (input.android) {
    return input.standalone || !input.installOfferVisible;
  }
  return false;
}
