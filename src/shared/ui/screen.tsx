import { type ReactNode } from "react";
import { type StyleProp, useColorScheme, type ViewStyle } from "react-native";
import { type Edges, SafeAreaView } from "react-native-safe-area-context";

import { getColors } from "@/shared/theme";
import { useIsDocumentScrollFrame } from "@/shared/ui/web-tab-bar-inset";

type ScreenProps = {
  children: ReactNode;
  edges?: Edges;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, edges, style }: ScreenProps) {
  const colors = getColors(useColorScheme());
  const documentScroll = useIsDocumentScrollFrame();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        { backgroundColor: colors.background },
        documentScroll ? null : { flex: 1 },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
