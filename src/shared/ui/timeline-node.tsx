import { StyleSheet, useColorScheme, View } from "react-native";

import { getColors } from "@/shared/theme";

export type TimelineNodeState = "past" | "current" | "upcoming" | "undated";

type TimelineNodeProps = {
  state: TimelineNodeState;
};

export function TimelineNode({ state }: TimelineNodeProps) {
  const colors = getColors(useColorScheme());
  const isPast = state === "past";
  const isCurrent = state === "current";
  const isUndated = state === "undated";

  return (
    <View
      style={[
        styles.outer,
        isCurrent ? styles.currentOuter : undefined,
        {
          borderColor: isPast || isCurrent ? colors.accent : colors.border,
          backgroundColor: isPast ? colors.accent : colors.surface,
          borderWidth: isCurrent ? 3 : isUndated ? 1.5 : 2,
          opacity: isUndated ? 0.72 : 1,
        },
      ]}
    >
      {isCurrent ? (
        <View style={[styles.inner, { backgroundColor: colors.accent }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  currentOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  inner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
