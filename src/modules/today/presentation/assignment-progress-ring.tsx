import { useEffect } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { getColors } from "@/shared/theme";
import { AppText, Stack } from "@/shared/ui";

import { getTaskProgress } from "./assignment-progress-ratio";

const RING_SIZE = 78;
const STROKE = 5;
const INNER_SIZE = RING_SIZE - STROKE * 2;
const DURATION_MS = 280;
const EASING = Easing.out(Easing.cubic);

type AssignmentProgressRingProps = {
  completed: number;
  total: number;
  dayLabel: string | null;
  countLabel: string;
};

/**
 * View-based circular progress (no SVG, no PNG frames).
 * Works in Expo Go.
 *
 * Always-visible gray track + accent quarter-arcs clipped to halves.
 * Progress layers are opacity-gated so 0/N stays empty.
 */
export function AssignmentProgressRing({
  completed,
  total,
  dayLabel,
  countLabel,
}: AssignmentProgressRingProps) {
  const colors = getColors(useColorScheme());
  const target = getTaskProgress(completed, total);
  const animated = useSharedValue(target);

  useEffect(() => {
    animated.value = withTiming(target, {
      duration: DURATION_MS,
      easing: EASING,
    });
  }, [animated, target]);

  // Right half sweeps 0 → 50% (clockwise from 12 o'clock).
  const rightStyle = useAnimatedStyle(() => {
    const portion = Math.min(Math.max(animated.value, 0), 0.5);
    return {
      opacity: animated.value > 0.001 ? 1 : 0,
      transform: [{ rotate: `${-135 + portion * 360}deg` }],
    };
  });

  // Left half sweeps 50% → 100%.
  const leftStyle = useAnimatedStyle(() => {
    const portion = Math.min(Math.max(animated.value - 0.5, 0), 0.5);
    return {
      opacity: animated.value > 0.5 ? 1 : 0,
      transform: [{ rotate: `${-135 + portion * 360}deg` }],
    };
  });

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(target * 100),
      }}
    >
      <View style={[styles.track, { borderColor: colors.borderStrong }]} />
      <View style={[styles.halfClip, styles.rightClip]}>
        <Animated.View
          style={[
            styles.halfFill,
            styles.rightAnchor,
            {
              borderTopColor: colors.accent,
              borderRightColor: colors.accent,
            },
            rightStyle,
          ]}
        />
      </View>
      <View style={[styles.halfClip, styles.leftClip]}>
        <Animated.View
          style={[
            styles.halfFill,
            styles.leftAnchor,
            {
              borderBottomColor: colors.accent,
              borderLeftColor: colors.accent,
            },
            leftStyle,
          ]}
        />
      </View>
      <View style={[styles.inner, { backgroundColor: colors.surfaceTint }]}>
        <Stack gap="xs" style={styles.innerCopy}>
          {dayLabel !== null ? (
            <AppText
              variant="caption"
              tone="secondary"
              style={styles.centerText}
            >
              {dayLabel}
            </AppText>
          ) : null}
          <AppText variant="label" style={[styles.centerText, styles.count]}>
            {countLabel}
          </AppText>
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
  },
  halfClip: {
    position: "absolute",
    top: 0,
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: "hidden",
  },
  rightClip: {
    right: 0,
  },
  leftClip: {
    left: 0,
  },
  halfFill: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
    borderColor: "transparent",
  },
  rightAnchor: {
    position: "absolute",
    right: 0,
  },
  leftAnchor: {
    position: "absolute",
    left: 0,
  },
  inner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  innerCopy: {
    alignItems: "center",
  },
  centerText: {
    textAlign: "center",
  },
  count: {
    fontWeight: "700",
  },
});
