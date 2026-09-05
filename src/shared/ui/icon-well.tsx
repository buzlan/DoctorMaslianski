import { StyleSheet, useColorScheme, View } from "react-native";

import { getColors, theme } from "@/shared/theme";

import { AppIcon, type AppIconName } from "./app-icon";

type IconWellProps = {
  name: AppIconName;
  shape?: "rounded" | "circle";
  size?: number;
};

export function IconWell({
  name,
  shape = "rounded",
  size = 44,
}: IconWellProps) {
  const colors = getColors(useColorScheme());
  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.well,
        {
          width: size,
          height: size,
          borderRadius: shape === "circle" ? size / 2 : theme.radii.md,
          backgroundColor: colors.accentSoft,
        },
      ]}
    >
      <AppIcon name={name} color={colors.accent} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    alignItems: "center",
    justifyContent: "center",
  },
});
