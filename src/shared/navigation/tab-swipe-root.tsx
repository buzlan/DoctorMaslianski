import { useFocusEffect, useRouter } from "expo-router";
import { type ReactNode, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  adjacentPrimaryTab,
  primaryTabHref,
  tabEnterTranslateX,
  type PrimaryTabRoute,
  type TabSwipeDirection,
} from "./primary-tabs";

const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 650;
const ENTER_DURATION_MS = 160;
const ENTER_EASING = Easing.out(Easing.cubic);

/** Last focused primary tab — shared so enter direction works for swipe and tab-bar taps. */
let lastFocusedPrimaryTab: PrimaryTabRoute | null = null;

type TabSwipeRootProps = {
  tab: PrimaryTabRoute;
  children: ReactNode;
};

/**
 * Horizontal edge swipe that drives Expo Router tab navigation, plus a subtle
 * enter fade/slide on the three primary tab roots only.
 */
export function TabSwipeRoot({ tab, children }: TabSwipeRootProps) {
  const router = useRouter();
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const from = lastFocusedPrimaryTab;
      lastFocusedPrimaryTab = tab;

      const offset = tabEnterTranslateX(from, tab);
      if (offset === null) {
        return;
      }

      opacity.value = 0.92;
      translateX.value = offset;
      opacity.value = withTiming(1, {
        duration: ENTER_DURATION_MS,
        easing: ENTER_EASING,
      });
      translateX.value = withTiming(0, {
        duration: ENTER_DURATION_MS,
        easing: ENTER_EASING,
      });
      // Shared values are stable; omit from deps so React Compiler accepts writes.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- opacity/translateX are SharedValues
    }, [tab]),
  );

  const move = useCallback(
    (direction: TabSwipeDirection) => {
      const next = adjacentPrimaryTab(tab, direction);
      if (next === null) {
        return;
      }
      router.navigate(primaryTabHref(next));
    },
    [router, tab],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-16, 16])
    .onEnd((event) => {
      "worklet";
      const { translationX, velocityX } = event;
      const wentNext =
        translationX <= -SWIPE_DISTANCE || velocityX <= -SWIPE_VELOCITY;
      const wentPrevious =
        translationX >= SWIPE_DISTANCE || velocityX >= SWIPE_VELOCITY;

      if (wentNext && !wentPrevious) {
        runOnJS(move)("next");
        return;
      }
      if (wentPrevious && !wentNext) {
        runOnJS(move)("previous");
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.fill, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
