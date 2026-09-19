import { StyleSheet, TextInput, useColorScheme } from "react-native";

import { getColors, theme } from "@/shared/theme";

type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
};

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  autoCapitalize = "none",
  autoCorrect = false,
}: TextFieldProps) {
  const colors = getColors(useColorScheme());

  return (
    <TextInput
      accessibilityLabel={label}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={[
        styles.input,
        {
          color: colors.textPrimary,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        },
      ]}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
});
