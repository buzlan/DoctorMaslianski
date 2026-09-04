import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, useColorScheme } from 'react-native';

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
import { AppText, Button, Screen, Stack } from '@/shared/ui';

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
      <Screen style={{ padding: theme.spacing.lg }}>
        <Stack gap="md">
          <AppText variant="title">{intro.title}</AppText>
          <AppText tone="secondary">{intro.body}</AppText>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Stack gap="md">
        <AppText variant="title">
          {hasToken ? copy.access.consentTitle : intro.title}
        </AppText>
        <AppText tone="secondary">
          {hasToken ? copy.access.consentBody : intro.body}
        </AppText>

        {!hasToken ? (
          <>
            <AppText>{copy.access.tokenLabel}</AppText>
            <TextInput
              accessibilityLabel={copy.access.tokenLabel}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setDraft}
              placeholder={copy.access.tokenPlaceholder}
              placeholderTextColor={colors.textSecondary}
              style={{
                color: colors.textPrimary,
                borderColor: colors.textSecondary,
                borderWidth: 1,
                borderRadius: theme.radii.sm,
                padding: theme.spacing.sm,
                minHeight: 48,
              }}
              value={draft}
            />
            <Button
              label={copy.access.continueWithInvite}
              onPress={() => {
                void onContinueWithPaste();
              }}
            />
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyAccepted }}
              onPress={() => setPrivacyAccepted((value) => !value)}
            >
              <AppText>
                {privacyAccepted ? "[x] " : "[ ] "}
                {copy.access.privacyAccept}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: pilotConsentAccepted }}
              onPress={() => setPilotConsentAccepted((value) => !value)}
            >
              <AppText>
                {pilotConsentAccepted ? "[x] " : "[ ] "}
                {copy.access.pilotConsentAccept}
              </AppText>
            </Pressable>
            {busy ? (
              <Stack gap="sm">
                <ActivityIndicator color={colors.accent} />
                <AppText tone="secondary">{copy.access.activating}</AppText>
              </Stack>
            ) : (
              <Button
                disabled={!privacyAccepted || !pilotConsentAccepted}
                label={copy.access.activate}
                onPress={() => {
                  void onActivate();
                }}
              />
            )}
          </>
        )}

        {inviteError !== null ? (
          <AppText tone="secondary">{copy.access.errors[inviteError]}</AppText>
        ) : null}
      </Stack>
    </Screen>
  );
}
