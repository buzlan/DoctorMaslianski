import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Animated, Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { copy } from '@/shared/copy';
import { theme } from '@/shared/theme';

import { SPLASH_FADE_MS, splashHoldRemainingMs } from '../app-splash-boot';

const SPLASH_SCREEN = require('../../../../assets/images/patient/splash_screen.png');
const STATIC_SPLASH_ID = 'boot-splash';

function staticSplashNode(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.getElementById(STATIC_SPLASH_ID);
}

type AppSplashProps = {
  holding: boolean;
  onFinished: () => void;
};

/**
 * Full-screen branded splash for the initial web/PWA boot.
 * The pre-JS `#boot-splash` uses the same asset; this overlay takes over
 * once that image is painted, then fades out. It is not a route.
 */
export function AppSplash({ holding, onFinished }: AppSplashProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [mountedAt] = useState(() => Date.now());
  const releasing = useRef(false);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (!painted || releasing.current) {
      return;
    }
    staticSplashNode()?.remove();
  }, [painted]);

  useEffect(() => {
    if (holding) {
      releasing.current = false;
      opacity.setValue(1);
      const node = staticSplashNode();
      if (node !== null) {
        node.style.transition = '';
        node.style.opacity = '1';
      }
      return;
    }

    let cancelled = false;
    let finishedDismiss = false;
    let fade: Animated.CompositeAnimation | null = null;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    const wait = splashHoldRemainingMs(Date.now() - mountedAt);
    const timer = setTimeout(() => {
      releasing.current = true;
      const node = staticSplashNode();
      if (node !== null) {
        node.style.transition = `opacity ${SPLASH_FADE_MS}ms linear`;
        node.style.opacity = '0';
      }
      const finish = () => {
        if (cancelled || finishedDismiss) {
          return;
        }
        finishedDismiss = true;
        node?.remove();
        onFinished();
      };
      fade = Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: false,
      });
      fade.start(({ finished }) => {
        if (finished) {
          finish();
        }
      });
      fallback = setTimeout(finish, SPLASH_FADE_MS + 40);
    }, wait);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (fallback !== null) {
        clearTimeout(fallback);
      }
      fade?.stop();
    };
  }, [holding, mountedAt, onFinished, opacity]);

  const splash = (
    <View
      pointerEvents="auto"
      accessibilityRole="image"
      accessibilityLabel={copy.access.loading}
      style={styles.host}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          painted ? styles.field : null,
          { opacity: painted ? opacity : 0 },
        ]}
      >
        <Image
          source={SPLASH_SCREEN}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          onLoad={() => {
            setPainted(true);
          }}
          style={styles.image}
        />
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(splash, document.body);
  }

  return splash;
}

const styles = StyleSheet.create({
  host: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2001,
    backgroundColor: 'transparent',
  } as ViewStyle,
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  } as ViewStyle,
  field: {
    backgroundColor: theme.colors.light.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
