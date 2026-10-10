import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { copy } from '@/shared/copy';
import { theme } from '@/shared/theme';
import { AppText, Stack } from '@/shared/ui';

import { isHandheld, lockPortrait, shouldBlockLandscape } from '../portrait-lock';

export function PortraitLock() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const phone = isHandheld(window.navigator.userAgent, window.navigator.maxTouchPoints);
    lockPortrait(window.screen.orientation ?? null);
    const media = window.matchMedia('(orientation: landscape)');
    const update = () => {
      setBlocked(shouldBlockLandscape({ web: true, landscape: media.matches, phone }));
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  if (!blocked || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <View style={styles.backdrop}>
      <Stack gap="sm" style={styles.copy}>
        <AppText variant="title" accessibilityRole="header">
          {copy.pwa.portraitTitle}
        </AppText>
        <AppText tone="secondary">{copy.pwa.portraitBody}</AppText>
      </Stack>
    </View>,
    document.body,
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.light.background,
  } as ViewStyle,
  copy: {
    maxWidth: 420,
  },
});
