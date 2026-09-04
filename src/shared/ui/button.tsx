import { Pressable, useColorScheme } from "react-native";

import { getColors } from "@/shared/theme";

import { AppText } from "./app-text";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const colors = getColors(useColorScheme());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <AppText style={{ color: disabled ? colors.textSecondary : colors.accent }}>
        {label}
      </AppText>
    </Pressable>
  );
}
