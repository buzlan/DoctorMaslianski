import { type ReactNode } from "react";
import { type StyleProp, useColorScheme, type ViewStyle } from "react-native";
import { type Edges, SafeAreaView } from "react-native-safe-area-context";

import { getColors } from "@/shared/theme";

type ScreenProps = {
  children: ReactNode;
  edges?: Edges;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, edges, style }: ScreenProps) {
  const colors = getColors(useColorScheme());

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
