import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { getColors } from "@/shared/theme";

import { AppIcon } from "./app-icon";

type BackIconButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

/** Icon-only back control with a 44×44 touch target. */
export function BackIconButton({
  onPress,
  accessibilityLabel,
}: BackIconButtonProps) {
  const colors = getColors(useColorScheme());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.target,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <AppIcon name="chevron-left" color={colors.accent} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
});
