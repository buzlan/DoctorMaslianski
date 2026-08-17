import { type ReactNode } from "react";
import { type StyleProp, useColorScheme, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getColors } from "@/shared/theme";

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: ScreenProps) {
  const colors = getColors(useColorScheme());

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
