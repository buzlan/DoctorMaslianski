const palette = {
  accent: "#208AEF",
  ink: "#1B2430",
  inkMuted: "#5C6773",
  canvas: "#F5F8FB",
  surface: "#FFFFFF",
  surfaceTint: "#E8F2FA",
  accentSoft: "#D6E8F8",
  accentOnAccent: "#FFFFFF",
  border: "#E3E8EE",
  borderStrong: "#C5D7EA",
  canvasDark: "#12161C",
  surfaceDark: "#1A2028",
  surfaceTintDark: "#173044",
  accentSoftDark: "#1A3348",
  inkOnDark: "#F5F8FB",
  inkMutedOnDark: "#9AA3AE",
  borderDark: "#2A3340",
  borderStrongDark: "#3A5570",
} as const;

const lightColors = {
  background: palette.canvas,
  surface: palette.surface,
  surfaceTint: palette.surfaceTint,
  textPrimary: palette.ink,
  textSecondary: palette.inkMuted,
  accent: palette.accent,
  accentSoft: palette.accentSoft,
  accentOnAccent: palette.accentOnAccent,
  border: palette.border,
  borderStrong: palette.borderStrong,
  overlay: "rgba(27, 36, 48, 0.06)",
} as const;

const darkColors = {
  background: palette.canvasDark,
  surface: palette.surfaceDark,
  surfaceTint: palette.surfaceTintDark,
  textPrimary: palette.inkOnDark,
  textSecondary: palette.inkMutedOnDark,
  accent: palette.accent,
  accentSoft: palette.accentSoftDark,
  accentOnAccent: palette.accentOnAccent,
  border: palette.borderDark,
  borderStrong: palette.borderStrongDark,
  overlay: "rgba(0, 0, 0, 0.28)",
} as const;

export const theme = {
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 },
  typography: {
    display: { fontSize: 32, fontWeight: "700" as const, lineHeight: 38 },
    title: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
    button: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  },
  radii: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  elevation: {
    card: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
  },
} as const;

export type Theme = typeof theme;
export type SemanticColors = Theme["colors"][keyof Theme["colors"]];

export function getColors(
  scheme: "light" | "dark" | "unspecified" | null | undefined,
) {
  return scheme === "dark" ? theme.colors.dark : theme.colors.light;
}

export function getCardShadow(
  scheme: "light" | "dark" | "unspecified" | null | undefined,
) {
  const colors = getColors(scheme);
  return {
    ...theme.elevation.card,
    shadowColor: colors.textPrimary,
  };
}
