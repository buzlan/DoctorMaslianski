import { Text, type TextProps, useColorScheme } from "react-native";

import { getColors, theme } from "@/shared/theme";

type AppTextVariant = keyof typeof theme.typography;

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  tone?: "primary" | "secondary";
};

export function AppText({
  variant = "body",
  tone = "primary",
  style,
  ...rest
}: AppTextProps) {
  const colors = getColors(useColorScheme());
  const color =
    tone === "secondary" ? colors.textSecondary : colors.textPrimary;

  return (
    <Text style={[theme.typography[variant], { color }, style]} {...rest} />
  );
}
