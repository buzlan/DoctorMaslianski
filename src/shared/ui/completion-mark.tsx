import { useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { getColors } from "@/shared/theme";

type CompletionMarkProps = {
  completed: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function CompletionMark({
  completed,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: CompletionMarkProps) {
  const colors = getColors(useColorScheme());
  const [progress] = useState(() => new Animated.Value(completed ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: completed ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [completed, progress]);

  const mark = (
    <Animated.View
      style={[
        styles.mark,
        {
          borderColor: completed ? colors.accent : colors.borderStrong,
          backgroundColor: completed ? colors.accent : colors.surface,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.checkWrap,
          {
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.check, { borderColor: colors.accentOnAccent }]} />
      </Animated.View>
    </Animated.View>
  );

  if (onPress === undefined) {
    return mark;
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: completed, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hit,
        { opacity: pressed || disabled ? 0.7 : 1 },
      ]}
    >
      {mark}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    marginTop: -2,
    transform: [{ rotate: "-45deg" }],
  },
});
