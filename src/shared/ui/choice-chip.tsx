import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { getColors, theme } from "@/shared/theme";

import { AppText } from "./app-text";

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function ChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
}: ChoiceChipProps) {
  const colors = getColors(useColorScheme());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <AppText
        variant="button"
        style={{ color: selected ? colors.accent : colors.textPrimary }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexBasis: 0,
  },
});
