import { useCallback, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { getColors, theme } from "@/shared/theme";
import { AppText } from "@/shared/ui";

import {
  diaryScaleFromTrackX,
  diaryScaleMarks,
  diaryScaleThumbCenter,
  DIARY_SCALE_MAX,
  DIARY_SCALE_MIN,
  stepDiaryScale,
} from "./diary-scale";

const THUMB_SIZE = 32;
const TRACK_HIT_HEIGHT = 44;
const TICK_WIDTH = 28;
const SNAP_MS = 80;

type DiaryScaleSliderProps = {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  accessibilityLabel: string;
};

export function DiaryScaleSlider({
  value,
  onChange,
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
  disabled = false,
  accessibilityLabel,
}: DiaryScaleSliderProps) {
  const colors = getColors(useColorScheme());
  const [trackReady, setTrackReady] = useState(false);

  const trackWidth = useSharedValue(0);
  const thumbCenter = useSharedValue(0);
  const hasValue = useSharedValue(value !== null);
  const committed = useSharedValue(value ?? Number.NaN);

  const commit = useCallback(
    (next: number) => {
      onChange(next);
    },
    [onChange],
  );

  const applyTouch = (x: number) => {
    "worklet";
    const width = trackWidth.value;
    if (width <= 0) {
      return;
    }
    const next = diaryScaleFromTrackX(x, width, min, max);
    hasValue.value = true;
    committed.value = next;
    let clampedX = x;
    if (clampedX < 0) {
      clampedX = 0;
    } else if (clampedX > width) {
      clampedX = width;
    }
    thumbCenter.value = clampedX;
    runOnJS(commit)(next);
  };

  const snapThumb = () => {
    "worklet";
    if (!hasValue.value || !Number.isFinite(committed.value)) {
      return;
    }
    thumbCenter.value = withTiming(
      diaryScaleThumbCenter(committed.value, trackWidth.value, min, max),
      { duration: SNAP_MS },
    );
  };

  const edgeSlop = {
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    top: 4,
    bottom: 4,
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .hitSlop(edgeSlop)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart((event) => {
      "worklet";
      applyTouch(event.x);
    })
    .onUpdate((event) => {
      "worklet";
      applyTouch(event.x);
    })
    .onFinalize(() => {
      "worklet";
      snapThumb();
    });

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .hitSlop(edgeSlop)
    .maxDistance(18)
    .onEnd((event, success) => {
      "worklet";
      if (!success) {
        return;
      }
      applyTouch(event.x);
      snapThumb();
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({
    width: hasValue.value ? Math.max(thumbCenter.value, 0) : 0,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbCenter.value - THUMB_SIZE / 2 }],
  }));

  const marks = diaryScaleMarks(min, max);
  const span = max - min;

  return (
    <View style={styles.root}>
      <View style={styles.ticks}>
        <Tick label={String(min)} ratio={0} color={colors.textSecondary} />
        <Tick label={String(max)} ratio={1} color={colors.textSecondary} />
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          accessibilityValue={{
            min,
            max,
            now: value ?? undefined,
          }}
          accessibilityActions={[
            { name: "increment" },
            { name: "decrement" },
          ]}
          onAccessibilityAction={(event) => {
            const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
            if (delta !== 1 && event.nativeEvent.actionName !== "decrement") {
              return;
            }
            const next = stepDiaryScale(value, delta, min, max);
            hasValue.value = true;
            committed.value = next;
            thumbCenter.value = diaryScaleThumbCenter(
              next,
              trackWidth.value,
              min,
              max,
            );
            onChange(next);
          }}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            trackWidth.value = width;
            thumbCenter.value = diaryScaleThumbCenter(
              value ?? min,
              width,
              min,
              max,
            );
            setTrackReady(true);
          }}
          style={styles.hit}
        >
          <View
            style={[styles.rail, { backgroundColor: colors.accentSoft }]}
          >
            <Animated.View
              style={[styles.fill, { backgroundColor: colors.accent }, fillStyle]}
            />
          </View>
          {trackReady ? (
            <Animated.View
              style={[
                styles.thumb,
                thumbStyle,
                {
                  backgroundColor:
                    value === null ? colors.surface : colors.accent,
                  borderColor: colors.accent,
                  borderWidth: value === null ? 2 : 0,
                },
              ]}
            >
              {value !== null ? (
                <AppText
                  variant="label"
                  style={[styles.thumbLabel, { color: colors.accentOnAccent }]}
                >
                  {value}
                </AppText>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </GestureDetector>
      <View style={styles.ticks}>
        {marks.map((mark) => (
          <Tick
            key={mark}
            label={String(mark)}
            ratio={span === 0 ? 0 : (mark - min) / span}
            color={colors.textSecondary}
          />
        ))}
      </View>
    </View>
  );
}

function Tick({
  label,
  ratio,
  color,
}: {
  label: string;
  ratio: number;
  color: string;
}) {
  return (
    <AppText
      variant="caption"
      style={[
        styles.tick,
        {
          left: `${ratio * 100}%`,
          color,
        },
      ]}
    >
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: theme.spacing.xs,
    paddingHorizontal: THUMB_SIZE / 2,
  },
  ticks: {
    height: 16,
    position: "relative",
  },
  tick: {
    position: "absolute",
    width: TICK_WIDTH,
    marginLeft: -TICK_WIDTH / 2,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
  hit: {
    height: TRACK_HIT_HEIGHT,
    justifyContent: "center",
  },
  rail: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 999,
  },
  thumb: {
    position: "absolute",
    top: (TRACK_HIT_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
});
