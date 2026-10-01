import type { AppIconName } from "./app-icon-names";

/**
 * Semantic AppIcon name → Ionicons glyph.
 * Code points are the Ionicons private-use values shipped with
 * @react-native-vector-icons/ionicons. Web draws these only after that font loads.
 */
const WEB_ICON_CODEPOINTS = {
  "notifications-outline": 62591,
  home: 62338,
  "home-outline": 62339,
  clipboard: 62023,
  "clipboard-outline": 62024,
  book: 62368,
  "book-outline": 62369,
  "camera-outline": 61916,
  "images-outline": 62354,
  "trash-outline": 62966,
  "calendar-outline": 61910,
  "call-outline": 61913,
  "mail-outline": 62516,
  "open-outline": 62600,
  "shield-checkmark-outline": 62841,
  "information-outline": 62363,
  "chevron-left": 61993,
  "chevron-right": 62011,
  checkmark: 61981,
} as const satisfies Record<AppIconName, number>;

export function webIconCodepoint(name: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(WEB_ICON_CODEPOINTS, name)) {
    return null;
  }
  return WEB_ICON_CODEPOINTS[name as AppIconName];
}

export function warnUnknownWebIcon(name: string): void {
  if (__DEV__) {
    console.warn(`Unknown AppIcon web mapping: ${name}`);
  }
}
