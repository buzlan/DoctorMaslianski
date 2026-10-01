export const APP_ICON_NAMES = [
  "notifications-outline",
  "home",
  "home-outline",
  "clipboard",
  "clipboard-outline",
  "book",
  "book-outline",
  "camera-outline",
  "images-outline",
  "trash-outline",
  "calendar-outline",
  "call-outline",
  "mail-outline",
  "open-outline",
  "shield-checkmark-outline",
  "information-outline",
  "chevron-left",
  "chevron-right",
  "checkmark",
] as const;

export type AppIconName = (typeof APP_ICON_NAMES)[number];
