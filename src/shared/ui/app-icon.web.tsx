import { useFonts } from "expo-font";
import { Text, View, type ColorValue } from "react-native";

import { APP_ICON_NAMES, type AppIconName } from "./app-icon-names";
import { warnUnknownWebIcon, webIconCodepoint } from "./app-icon-web-map";

export { APP_ICON_NAMES };
export type { AppIconName };

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
};

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  const [fontLoaded] = useFonts({
    Ionicons: require("@react-native-vector-icons/ionicons/fonts/Ionicons.ttf"),
  });
  const codepoint = webIconCodepoint(name);

  if (codepoint === null) {
    warnUnknownWebIcon(name);
    return <View style={{ width: size, height: size }} />;
  }

  if (!fontLoaded) {
    return <View style={{ width: size, height: size }} />;
  }

  return (
    <Text
      selectable={false}
      style={{
        fontFamily: "Ionicons",
        fontSize: size,
        lineHeight: size,
        width: size,
        height: size,
        color,
        textAlign: "center",
      }}
    >
      {String.fromCodePoint(codepoint)}
    </Text>
  );
}
