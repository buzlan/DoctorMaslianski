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

function stroke(color: ColorValue, width = 1.8) {
  return { borderColor: color, borderWidth: width };
}

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  const filled = name === "home" || name === "clipboard" || name === "book";

  if (name === "home" || name === "home-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.34,
            borderRightWidth: size * 0.34,
            borderBottomWidth: size * 0.3,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: color,
          }}
        />
        <View
          style={[
            stroke(color),
            filled ? { backgroundColor: color } : undefined,
            {
              width: size * 0.5,
              height: size * 0.38,
              marginTop: -1,
              borderTopWidth: 0,
            },
          ]}
        />
      </View>
    );
  }

  if (name === "clipboard" || name === "clipboard-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View
          style={[
            stroke(color),
            {
              width: size * 0.3,
              height: size * 0.16,
              borderRadius: 3,
              backgroundColor: filled ? color : "transparent",
              zIndex: 1,
              marginBottom: -size * 0.08,
            },
          ]}
        />
        <View
          style={[
            stroke(color),
            {
              width: size * 0.56,
              height: size * 0.64,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              paddingTop: size * 0.08,
            },
          ]}
        >
          <View style={{ width: size * 0.28, height: 1.5, backgroundColor: color }} />
          <View style={{ width: size * 0.28, height: 1.5, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  if (name === "book" || name === "book-outline") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <View
            style={[
              stroke(color),
              {
                width: size * 0.3,
                height: size * 0.58,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                backgroundColor: filled ? color : "transparent",
              },
            ]}
          />
          <View
            style={{
              width: 1.8,
              height: size * 0.62,
              backgroundColor: color,
              marginHorizontal: -0.5,
            }}
          />
          <View
            style={[
              stroke(color),
              {
                width: size * 0.3,
                height: size * 0.58,
                borderTopRightRadius: 3,
                borderBottomRightRadius: 3,
                backgroundColor: filled ? color : "transparent",
              },
            ]}
          />
        </View>
      </View>
    );
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
              { width: size * 0.2, height: size * 0.2, borderRadius: size },
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
            { width: size * 0.6, height: size * 0.6, borderRadius: 4, overflow: "hidden" },
          ]}
        >
          <View style={{ height: size * 0.16, backgroundColor: color }} />
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
            { width: size * 0.7, height: size * 0.46, borderRadius: 3 },
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
            { width: size * 0.46, height: size * 0.46, borderRadius: 3 },
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
