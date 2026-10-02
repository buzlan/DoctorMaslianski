import type { AppIconName } from "./app-icon-names";

export type WebIconPaint = "fill" | "stroke";

export type WebIconGlyph = {
  paint: WebIconPaint;
  paths: readonly string[];
};

/**
 * Semantic AppIcon name → inline SVG paths.
 * Web does not use the Ionicons private-use font: production was serving that
 * .ttf URL as the HTML shell, so the glyphs rendered as missing-character boxes.
 */
const WEB_ICON_GLYPHS = {
  "notifications-outline": {
    paint: "stroke",
    paths: [
      "M6 9.2a6 6 0 0 1 12 0c0 4.2 1.4 5.6 2 7.3H4c.6-1.7 2-3.1 2-7.3z",
      "M10 18.2a2 2 0 0 0 4 0",
    ],
  },
  home: {
    paint: "fill",
    paths: ["M12 3.2 3.4 10.2V21h6.2v-6.4h4.8V21h6.2v-10.8L12 3.2z"],
  },
  "home-outline": {
    paint: "stroke",
    paths: ["M4 11 12 4l8 7v9H4v-9z", "M9.5 20v-6h5v6"],
  },
  clipboard: {
    paint: "fill",
    paths: ["M9 3.5h6V6H9V3.5z", "M7 5.2h10.2A1.8 1.8 0 0 1 19 7v12.2a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 19.2V7A1.8 1.8 0 0 1 7 5.2z"],
  },
  "clipboard-outline": {
    paint: "stroke",
    paths: [
      "M9 4h6v2.2H9V4z",
      "M8 6.2h8A2 2 0 0 1 18 8.2v11A2 2 0 0 1 16 21.2H8A2 2 0 0 1 6 19.2v-11A2 2 0 0 1 8 6.2z",
      "M9 12h6",
      "M9 15.5h4",
    ],
  },
  book: {
    paint: "fill",
    paths: ["M4 4.5h6.4c.9 0 1.6.4 1.6 1.4V20c-.6-.4-1.3-.6-2-.6H4V4.5z", "M20 4.5h-6.4c-.9 0-1.6.4-1.6 1.4V20c.6-.4 1.3-.6 2-.6H20V4.5z"],
  },
  "book-outline": {
    paint: "stroke",
    paths: [
      "M4 5h6.2A2.2 2.2 0 0 1 12.4 7.2V20c-.7-.5-1.5-.7-2.2-.7H4V5z",
      "M20 5h-6.2A2.2 2.2 0 0 0 11.6 7.2V20c.7-.5 1.5-.7 2.2-.7H20V5z",
    ],
  },
  "camera-outline": {
    paint: "stroke",
    paths: [
      "M8.2 6.2h2L11.4 4.5h1.2L13.8 6.2H16a2 2 0 0 1 2 2v9.2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2.2-2z",
      "M12 10.2a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z",
    ],
  },
  "images-outline": {
    paint: "stroke",
    paths: [
      "M4 8.2h11.2A1.6 1.6 0 0 1 16.8 9.8v8.4A1.6 1.6 0 0 1 15.2 19.8H4.8A1.6 1.6 0 0 1 3.2 18.2V9.8A1.6 1.6 0 0 1 4.8 8.2H4z",
      "M8 6.2h11.2A1.6 1.6 0 0 1 20.8 7.8v8.4",
      "M6.2 16.2l2.4-2.4 1.6 1.5 2.2-2.3 2.4 2.4",
    ],
  },
  "trash-outline": {
    paint: "stroke",
    paths: ["M5 7.5h14", "M9.2 7.5V5.2h5.6v2.3", "M7.2 7.5l.8 12.2h8l.8-12.2"],
  },
  "calendar-outline": {
    paint: "stroke",
    paths: ["M5 6.5h14v13H5v-13z", "M5 10.5h14", "M8.5 4.5v4", "M15.5 4.5v4"],
  },
  "call-outline": {
    paint: "stroke",
    paths: ["M8 4.5h2.4l1.2 3.2-1.8 1.1a10.5 10.5 0 0 0 4.9 4.9l1.1-1.8 3.2 1.2V16a1.8 1.8 0 0 1-1.8 1.8A12.3 12.3 0 0 1 6.2 6.3 1.8 1.8 0 0 1 8 4.5z"],
  },
  "mail-outline": {
    paint: "stroke",
    paths: ["M4 7h16v11H4V7z", "M4.5 7.6 12 13l7.5-5.4"],
  },
  "open-outline": {
    paint: "stroke",
    paths: ["M10 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V14", "M13 5h6v6", "M19 5l-8 8"],
  },
  "shield-checkmark-outline": {
    paint: "stroke",
    paths: ["M12 3.5 5.5 6.2v5.6c0 4.2 2.7 6.6 6.5 8.2 3.8-1.6 6.5-4 6.5-8.2V6.2L12 3.5z", "M8.8 12.1 11 14.3l4.3-4.6"],
  },
  "information-outline": {
    paint: "stroke",
    paths: ["M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6z", "M12 11v5", "M12 8h.01"],
  },
  "chevron-left": {
    paint: "stroke",
    paths: ["M14.5 5.5 8 12l6.5 6.5"],
  },
  "chevron-right": {
    paint: "stroke",
    paths: ["M9.5 5.5 16 12l-6.5 6.5"],
  },
  checkmark: {
    paint: "stroke",
    paths: ["M5 12.5 10 17.5 19 6.5"],
  },
} as const satisfies Record<AppIconName, WebIconGlyph>;

const FALLBACK_GLYPH: WebIconGlyph = {
  paint: "stroke",
  paths: ["M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z"],
};

export function resolveWebIcon(name: string): { known: boolean; glyph: WebIconGlyph } {
  if (!Object.prototype.hasOwnProperty.call(WEB_ICON_GLYPHS, name)) {
    return { known: false, glyph: FALLBACK_GLYPH };
  }
  return { known: true, glyph: WEB_ICON_GLYPHS[name as AppIconName] };
}

export function warnUnknownWebIcon(name: string): void {
  if (__DEV__) {
    console.warn(`Unknown AppIcon web mapping: ${name}`);
  }
}
