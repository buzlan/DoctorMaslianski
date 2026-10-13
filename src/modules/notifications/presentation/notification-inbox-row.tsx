import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { getColors, theme } from '@/shared/theme';
import { AppIcon } from '@/shared/ui/app-icon';
import { AppText } from '@/shared/ui/app-text';
import { Stack } from '@/shared/ui/stack';

import { formatInboxTime, textForNotification, type InboxItem } from '../inbox';

const SWIPE_DISTANCE = 88;
const SWIPE_VELOCITY = 0.65;
const EXIT_DISTANCE = 420;
const EXIT_MS = 240;
const COLLAPSE_MS = 200;
const EXIT_EASING = Easing.bezier(0.22, 0.9, 0.3, 1);

type NotificationInboxRowProps = {
  item: InboxItem;
  onDismissed: (item: InboxItem) => void;
};

export function NotificationInboxRow({ item, onDismissed }: NotificationInboxRowProps) {
  const colors = getColors(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const height = useRef(new Animated.Value(0)).current;
  const gap = useRef(new Animated.Value(theme.spacing.md)).current;
  const dismissing = useRef(false);
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;
  const [laidOut, setLaidOut] = useState(false);

  const revealToRight = translateX.interpolate({
    inputRange: [0, 36, 120],
    outputRange: [0, 0.45, 1],
    extrapolate: 'clamp',
  });
  const revealToLeft = translateX.interpolate({
    inputRange: [-120, -36, 0],
    outputRange: [1, 0.45, 0],
    extrapolate: 'clamp',
  });
  const cardOpacity = translateX.interpolate({
    inputRange: [-EXIT_DISTANCE, -48, 0, 48, EXIT_DISTANCE],
    outputRange: [0.15, 1, 1, 1, 0.15],
    extrapolate: 'clamp',
  });
  const cardScale = translateX.interpolate({
    inputRange: [-220, 0, 220],
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });

  function dismiss(direction: 1 | -1) {
    if (dismissing.current) {
      return;
    }
    dismissing.current = true;
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: direction * EXIT_DISTANCE,
        duration: EXIT_MS,
        easing: EXIT_EASING,
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(height, {
          toValue: 0,
          duration: COLLAPSE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(gap, {
          toValue: 0,
          duration: COLLAPSE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onDismissedRef.current(item);
      }
    });
  }

  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        !dismissing.current &&
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_event, gesture) => {
        if (dismissing.current) {
          return;
        }
        translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_event, gesture) => {
        if (dismissing.current) {
          return;
        }
        const flung =
          Math.abs(gesture.dx) > SWIPE_DISTANCE || Math.abs(gesture.vx) > SWIPE_VELOCITY;
        if (flung) {
          dismissRef.current(gesture.dx >= 0 ? 1 : -1);
          return;
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          bounciness: 7,
          speed: 18,
        }).start();
      },
      onPanResponderTerminate: () => {
        if (dismissing.current) {
          return;
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          bounciness: 7,
          speed: 18,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.slot,
        laidOut ? { height, marginBottom: gap } : { marginBottom: theme.spacing.md },
      ]}
    >
      <View
        onLayout={(event) => {
          if (dismissing.current || laidOut) {
            return;
          }
          height.setValue(event.nativeEvent.layout.height);
          setLaidOut(true);
        }}
        style={laidOut ? styles.measured : undefined}
      >
        <View style={[styles.reveal, { backgroundColor: colors.accent }]}>
          <Animated.View style={[styles.revealIcon, styles.revealIconStart, { opacity: revealToRight }]}>
            <AppIcon name="checkmark" size={22} color={colors.accentOnAccent} />
          </Animated.View>
          <Animated.View style={[styles.revealIcon, styles.revealIconEnd, { opacity: revealToLeft }]}>
            <AppIcon name="checkmark" size={22} color={colors.accentOnAccent} />
          </Animated.View>
        </View>
        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: cardOpacity,
              transform: [{ translateX }, { scale: cardScale }],
            },
          ]}
        >
          <Pressable accessibilityRole="button" onPress={() => dismissRef.current(1)} style={styles.press}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Stack gap="xs" style={styles.rowCopy}>
                <AppText>{textForNotification(item.kind)}</AppText>
                <AppText variant="caption" tone="secondary">
                  {formatInboxTime(item.createdAt)}
                </AppText>
              </Stack>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    overflow: 'hidden',
  },
  measured: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  reveal: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radii.lg,
  },
  revealIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  revealIconStart: {
    left: theme.spacing.md,
  },
  revealIconEnd: {
    right: theme.spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: theme.radii.lg,
  },
  press: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  rowCopy: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
