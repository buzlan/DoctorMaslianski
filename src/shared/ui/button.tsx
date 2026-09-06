import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { getColors, theme } from "@/shared/theme";

import { AppText } from "./app-text";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  variant?: ButtonVariant;
};

export function Button({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  variant,
}: ButtonProps) {
  const colors = getColors(useColorScheme());
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const chrome = isPrimary || isSecondary;

  const labelColor = disabled
    ? colors.textSecondary
    : isPrimary
      ? colors.accentOnAccent
      : isGhost
        ? colors.textSecondary
        : colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        chrome ? styles.chrome : undefined,
        { opacity: pressed ? 0.82 : 1 },
        isPrimary
          ? {
              backgroundColor: disabled ? colors.accentSoft : colors.accent,
            }
          : undefined,
        isSecondary
          ? {
              backgroundColor: colors.surface,
              borderColor: disabled ? colors.border : colors.accent,
              borderWidth: 1.5,
            }
          : undefined,
      ]}
    >
      <AppText
        variant={chrome ? "button" : "body"}
        style={{ color: labelColor, textAlign: chrome ? "center" : undefined }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chrome: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
