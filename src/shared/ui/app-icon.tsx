import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, View, type ColorValue } from "react-native";

export const APP_ICON_NAMES = [
  "home",
  "home-outline",
  "clipboard",
  "clipboard-outline",
  "book",
  "book-outline",
  "camera-outline",
  "calendar-outline",
  "call-outline",
  "mail-outline",
  "open-outline",
  "shield-checkmark-outline",
  "checkmark",
] as const;

export type AppIconName = (typeof APP_ICON_NAMES)[number];

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS = {
  home: "home",
  "home-outline": "home-outline",
  clipboard: "clipboard-outline",
  "clipboard-outline": "clipboard-outline",
  book: "journal-outline",
  "book-outline": "journal-outline",
} as const satisfies Partial<Record<AppIconName, IoniconName>>;

function isTabIcon(name: AppIconName): name is keyof typeof TAB_ICONS {
  return Object.prototype.hasOwnProperty.call(TAB_ICONS, name);
}

function stroke(color: ColorValue, width = 1.8) {
  return { borderColor: color, borderWidth: width };
}

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  if (isTabIcon(name)) {
    return <Ionicons name={TAB_ICONS[name]} size={size} color={color} />;
  }

  if (name === "camera-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.7,
              height: size * 0.48,
              borderRadius: 5,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <View
            style={[
              stroke(color),
              {
                width: size * 0.2,
                height: size * 0.2,
                borderRadius: size,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  if (name === "calendar-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: 4,
              overflow: "hidden",
            },
          ]}
        >
          <View
            style={{
              height: size * 0.16,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  if (name === "call-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.32,
              height: size * 0.52,
              borderRadius: size,
              transform: [{ rotate: "-28deg" }],
            },
          ]}
        />
      </View>
    );
  }

  if (name === "mail-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.7,
              height: size * 0.46,
              borderRadius: 3,
            },
          ]}
        />
      </View>
    );
  }

  if (name === "open-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.46,
              height: size * 0.46,
              borderRadius: 3,
            },
          ]}
        />
      </View>
    );
  }

  if (name === "shield-checkmark-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.5,
              height: size * 0.6,
              borderRadius: size * 0.24,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.2,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});
