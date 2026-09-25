import { StyleSheet, useColorScheme, View } from "react-native";

import { getColors } from "@/shared/theme";

export type TimelineNodeState = "past" | "current" | "upcoming" | "undated";

type TimelineNodeProps = {
  state: TimelineNodeState;
};

export function TimelineNode({ state }: TimelineNodeProps) {
  const colors = getColors(useColorScheme());
  const isCompleted = state === "past" || state === "current";
  const isUndated = state === "undated";

  return (
    <View
      style={[
        styles.outer,
        {
          borderColor: isCompleted ? colors.accent : colors.border,
          backgroundColor: isCompleted ? colors.accent : colors.surface,
          opacity: isUndated ? 0.72 : 1,
        },
      ]}
    >
      {isCompleted ? <View style={styles.checkmark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    width: 8,
    height: 13,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ translateY: -1 }, { rotate: "45deg" }],
  },
});
