import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useColorScheme } from 'react-native';

import { resolveAuthGate, useAuthSession } from '@/core/auth';
import {
  activatePendingInvite,
  getPendingInviteToken,
  parseInviteToken,
  setPendingInviteToken,
  type InviteConsumeError,
} from '@/modules/invite';
import { copy } from '@/shared/copy';
import { getColors, theme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  CheckboxRow,
  IconWell,
  Screen,
  ScreenHeader,
  Stack,
  TextField,
} from '@/shared/ui';

export default function AccessScreen() {
  const auth = useAuthSession();
  const gate = resolveAuthGate(auth, __DEV__);
  const colors = getColors(useColorScheme());
  const reason =
    gate.screen === 'access' ? gate.reason : 'authentication_required';
  const intro =
    reason === 'service_unavailable'
      ? copy.access.serviceUnavailable
      : copy.access.authenticationRequired;

  const [draft, setDraft] = useState('');
  const [hasToken, setHasToken] = useState(() => getPendingInviteToken() !== null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [pilotConsentAccepted, setPilotConsentAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteError, setInviteError] = useState<InviteConsumeError | null>(null);

  async function onContinueWithPaste() {
    const token = parseInviteToken(draft);
    if (token === null) {
      setInviteError('invalid');
      return;
    }
    setPendingInviteToken(token);
    setDraft('');
    setInviteError(null);
    setHasToken(true);
  }

  async function onActivate() {
    setBusy(true);
    setInviteError(null);
    const result = await activatePendingInvite({
      privacyAccepted,
      pilotConsentAccepted,
    });
    setBusy(false);
    if (result.status === 'error') {
      setInviteError(result.error);
    }
  }

  if (reason === 'service_unavailable') {
    return (
      <Screen style={styles.content}>
        <Stack gap="lg">
          <IconWell name="shield-checkmark-outline" shape="circle" size={64} />
          <ScreenHeader title={intro.title} subtitle={intro.body} />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen style={styles.content}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="lg">
          <Stack gap="md" style={styles.hero}>
            <IconWell name="shield-checkmark-outline" shape="circle" size={64} />
            <ScreenHeader
              title={hasToken ? copy.access.consentTitle : intro.title}
              subtitle={hasToken ? copy.access.consentBody : intro.body}
            />
          </Stack>

          {!hasToken ? (
            <Card variant="elevated">
              <Stack gap="md">
                <AppText variant="label">{copy.access.tokenLabel}</AppText>
                <TextField
                  label={copy.access.tokenLabel}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setDraft}
                  placeholder={copy.access.tokenPlaceholder}
                  value={draft}
                />
                <Button
                  variant="primary"
                  label={copy.access.continueWithInvite}
                  onPress={() => {
                    void onContinueWithPaste();
                  }}
                />
              </Stack>
            </Card>
          ) : (
            <Card variant="elevated">
              <Stack gap="md">
                <CheckboxRow
                  label={copy.access.privacyAccept}
                  checked={privacyAccepted}
                  disabled={busy}
                  onPress={() => setPrivacyAccepted((value) => !value)}
                />
                <CheckboxRow
                  label={copy.access.pilotConsentAccept}
                  checked={pilotConsentAccepted}
                  disabled={busy}
                  onPress={() => setPilotConsentAccepted((value) => !value)}
                />
                {busy ? (
                  <Stack gap="sm" style={styles.activating}>
                    <ActivityIndicator color={colors.accent} />
                    <AppText tone="secondary">{copy.access.activating}</AppText>
                  </Stack>
                ) : (
                  <Button
                    variant="primary"
                    disabled={!privacyAccepted || !pilotConsentAccepted}
                    label={copy.access.activate}
                    onPress={() => {
                      void onActivate();
                    }}
                  />
                )}
              </Stack>
            </Card>
          )}

          {inviteError !== null ? (
            <AppText tone="secondary">{copy.access.errors[inviteError]}</AppText>
          ) : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
  },
  activating: {
    alignItems: 'center',
  },
});
