import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useAuthSession } from '@/core/auth';
import { getSharedSupabaseClient } from '@/core/supabase/client';
import { copy } from '@/shared/copy';
import { theme } from '@/shared/theme';
import { AppText, Button, Card, Screen, Stack } from '@/shared/ui';

import {
  browserSessionStorage,
  clearActivationHomeFlag,
  currentHomeScreenInstallSteps,
  readActivationHomeFlag,
} from '../activation-flow';
import { writeBrowserHandoffCookie } from '../handoff-cookie';
import { createWebSessionHandoff } from '../handoff-api';
import { isRunningAsInstalledWebApp } from '../installed-web-app';
import { prepareIosHandoff } from '../prepare-ios-handoff';

type Step = 'offer' | 'preparing' | 'ios' | 'error';

export function ActivationHomeScreenHost() {
  const auth = useAuthSession();
  const storage = browserSessionStorage();
  const [visible, setVisible] = useState(() => readActivationHomeFlag(storage));
  const [step, setStep] = useState<Step>('offer');

  if (
    Platform.OS !== 'web' ||
    !visible ||
    isRunningAsInstalledWebApp() ||
    typeof document === 'undefined'
  ) {
    return null;
  }

  function finish() {
    clearActivationHomeFlag(storage);
    setVisible(false);
  }

  async function onAdd() {
    if (auth.status !== 'authenticated') {
      setStep('error');
      return;
    }
    setStep('preparing');
    const prepared = await prepareIosHandoff({
      create: async () => {
        const client = getSharedSupabaseClient();
        if (client === null) {
          return { status: 'failed' };
        }
        return createWebSessionHandoff(client);
      },
      writeCookie: writeBrowserHandoffCookie,
    });
    setStep(prepared === 'ready' ? 'ios' : 'error');
  }

  const steps =
    typeof navigator === 'undefined'
      ? copy.pwa.iosSteps
      : currentHomeScreenInstallSteps(navigator.userAgent, navigator.maxTouchPoints);

  return createPortal(
    <View style={styles.backdrop}>
      <Screen style={styles.screen}>
        <Card style={styles.card}>
          <Stack gap="md">
            <AppText variant="title" accessibilityRole="header">
              {copy.pwa.activatedTitle}
            </AppText>
            <AppText>{copy.pwa.activatedBody}</AppText>
            <AppText tone="secondary">{copy.pwa.activatedDescription}</AppText>
            {step === 'ios' ? (
              <Stack gap="sm">
                {steps.map((line, index) => (
                  <AppText key={line}>
                    {index + 1}. {line}
                  </AppText>
                ))}
              </Stack>
            ) : null}
            {step === 'error' ? <AppText tone="secondary">{copy.pwa.prepareError}</AppText> : null}
            {step === 'ios' ? null : (
              <Button
                label={copy.pwa.activatedAdd}
                variant="primary"
                disabled={step === 'preparing'}
                onPress={() => {
                  void onAdd();
                }}
              />
            )}
            <Button label={copy.pwa.activatedContinue} variant="secondary" onPress={finish} />
          </Stack>
        </Card>
      </Screen>
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
    zIndex: 80,
    backgroundColor: theme.colors.light.background,
  } as ViewStyle,
  screen: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
