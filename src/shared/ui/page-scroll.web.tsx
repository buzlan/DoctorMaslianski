import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export type PageScrollProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

/**
 * Web tab pages grow with their content so the document scrolls.
 * The inner ScrollView style is ignored: a nested scrollport keeps Safari's toolbar open.
 */
export function PageScroll({ children, contentContainerStyle }: PageScrollProps) {
  return <View style={contentContainerStyle}>{children}</View>;
}
