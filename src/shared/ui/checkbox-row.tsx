import { type ReactNode } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { getColors, theme } from "@/shared/theme";

import { AppText } from "./app-text";

type CheckboxRowProps = {
  label: string;
  labelContent?: ReactNode;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function CheckboxRow({
  label,
  labelContent,
  checked,
  onPress,
  disabled = false,
}: CheckboxRowProps) {
  const colors = getColors(useColorScheme());

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: checked ? colors.accent : colors.borderStrong,
              backgroundColor: checked ? colors.accent : colors.surface,
            },
          ]}
        >
          {checked ? (
            <AppText
              variant="label"
              style={[styles.check, { color: colors.accentOnAccent }]}
            >
              ✓
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {labelContent ?? (
        <AppText
          style={styles.label}
          onPress={disabled ? undefined : onPress}
        >
          {label}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  check: {
    lineHeight: 16,
  },
  label: {
    flex: 1,
  },
});
