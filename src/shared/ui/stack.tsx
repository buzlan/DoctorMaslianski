import { type ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { theme } from "@/shared/theme";

type StackProps = {
  children: ReactNode;
  gap?: keyof typeof theme.spacing;
  style?: StyleProp<ViewStyle>;
};

export function Stack({ children, gap, style }: StackProps) {
  return (
    <View style={[gap ? { gap: theme.spacing[gap] } : undefined, style]}>
      {children}
    </View>
  );
}
