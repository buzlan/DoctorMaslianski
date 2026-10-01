import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

import { useWebTabBarInset } from "./web-tab-bar-inset";

export function PinnedFooter({ children }: { children: ReactNode }) {
  const inset = useWebTabBarInset();

  return (
    <View style={{ position: "sticky", bottom: inset, zIndex: 2 } as ViewStyle}>{children}</View>
  );
}
