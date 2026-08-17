const palette = {
  accent: "#208AEF",
  ink: "#1B2430",
  inkMuted: "#5C6773",
  canvas: "#F5F8FB",
  canvasDark: "#12161C",
  inkOnDark: "#F5F8FB",
  inkMutedOnDark: "#9AA3AE",
} as const;

export const theme = {
  colors: {
    light: {
      background: palette.canvas,
      textPrimary: palette.ink,
      textSecondary: palette.inkMuted,
      accent: palette.accent,
    },
    dark: {
      background: palette.canvasDark,
      textPrimary: palette.inkOnDark,
      textSecondary: palette.inkMutedOnDark,
      accent: palette.accent,
    },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  typography: {
    title: { fontSize: 24, fontWeight: "600" as const, lineHeight: 32 },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  },
  radii: { sm: 8, md: 12, lg: 16 },
} as const;

export type Theme = typeof theme;
export type SemanticColors = Theme["colors"]["light"];

export function getColors(
  scheme: "light" | "dark" | "unspecified" | null | undefined,
) {
  return scheme === "dark" ? theme.colors.dark : theme.colors.light;
}
