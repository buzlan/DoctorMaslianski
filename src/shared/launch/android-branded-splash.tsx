import { useEffect, useState } from "react";
import { Animated, Image, Platform, StyleSheet, View } from "react-native";

const SPLASH_SCREEN = require("../../../assets/images/patient/splash_screen.png");

/** Visible hold after native splash hides (cold launch, Android only). */
const HOLD_MS = 1000;
/** Fade-out duration. */
const FADE_MS = 280;

/** Survives RootLayout remounts within the same JS process (not a cold launch). */
let androidBrandedSplashConsumed = false;

export function shouldShowAndroidBrandedSplash(): boolean {
  return Platform.OS === "android" && !androidBrandedSplashConsumed;
}

type AndroidBrandedSplashOverlayProps = {
  onFinished: () => void;
};

/**
 * Full-screen branded splash for Android only, after the native splash hides.
 * Not a route — launch overlay so it never enters navigation history.
 */
export function AndroidBrandedSplashOverlay({
  onFinished,
}: AndroidBrandedSplashOverlayProps) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let cancelled = false;
    const hold = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!cancelled && finished) {
          androidBrandedSplashConsumed = true;
          onFinished();
        }
      });
    }, HOLD_MS);

    return () => {
      cancelled = true;
      clearTimeout(hold);
    };
  }, [onFinished, opacity]);

  return (
    <View style={styles.host} pointerEvents="auto">
      <Animated.View style={[styles.fill, { opacity }]}>
        <Image
          source={SPLASH_SCREEN}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
});
