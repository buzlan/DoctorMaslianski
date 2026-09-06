import { type ReactNode } from "react";
import {
  StyleSheet,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { getCardShadow, getColors, theme } from "@/shared/theme";

export type CardVariant = "elevated" | "tinted" | "outlined";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = "elevated", style }: CardProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  return (
    <View
      style={[
        styles.base,
        variant === "elevated"
          ? [
              { backgroundColor: colors.surface, borderColor: colors.border },
              getCardShadow(scheme),
            ]
          : undefined,
        variant === "tinted"
          ? {
              backgroundColor: colors.surfaceTint,
              borderColor: colors.borderStrong,
            }
          : undefined,
        variant === "outlined"
          ? {
              backgroundColor: colors.surface,
              borderColor: colors.borderStrong,
            }
          : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md,
  },
});
