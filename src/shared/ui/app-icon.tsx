import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, View, type ColorValue } from "react-native";

export const APP_ICON_NAMES = [
  "notifications-outline",
  "home",
  "home-outline",
  "clipboard",
  "clipboard-outline",
  "book",
  "book-outline",
  "camera-outline",
  "images-outline",
  "trash-outline",
  "calendar-outline",
  "call-outline",
  "mail-outline",
  "open-outline",
  "shield-checkmark-outline",
  "chevron-left",
  "chevron-right",
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
  if (name === "notifications-outline") {
    return <Ionicons name={name} size={size} color={color} />;
  }

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

  if (name === "images-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.58,
              height: size * 0.46,
              borderRadius: 4,
              marginTop: size * 0.08,
              marginLeft: size * 0.06,
            },
          ]}
        />
        <View
          style={[
            stroke(color),
            {
              width: size * 0.58,
              height: size * 0.46,
              borderRadius: 4,
              position: "absolute",
              top: size * 0.08,
              left: size * 0.08,
              backgroundColor: "transparent",
            },
          ]}
        />
      </View>
    );
  }

  if (name === "trash-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={{
            width: size * 0.36,
            height: 1.8,
            backgroundColor: color,
            marginBottom: 2,
          }}
        />
        <View
          style={[
            stroke(color),
            {
              width: size * 0.42,
              height: size * 0.48,
              borderRadius: 3,
              borderTopWidth: 1.8,
            },
          ]}
        />
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

  if (name === "chevron-left") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderLeftWidth: 2.2,
            borderBottomWidth: 2.2,
            borderColor: color,
            transform: [{ rotate: "45deg" }],
            marginLeft: size * 0.12,
          }}
        />
      </View>
    );
  }

  if (name === "chevron-right") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderRightWidth: 2.2,
            borderTopWidth: 2.2,
            borderColor: color,
            transform: [{ rotate: "45deg" }],
            marginRight: size * 0.12,
          }}
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
