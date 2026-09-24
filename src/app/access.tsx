import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { resolveAuthGate, useAuthSession } from '@/core/auth';
import {
  activatePendingInvite,
  getPendingInviteToken,
  parseInviteToken,
  setPendingInviteToken,
  type InviteConsumeError,
} from '@/modules/invite';
import { PRIVACY_POLICY_URL } from '@/shared/config/privacy-policy';
import { copy } from '@/shared/copy';
import { getColors, theme } from '@/shared/theme';
import {
  AppIcon,
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

async function openPrivacyPolicy() {
  if (PRIVACY_POLICY_URL === null || PRIVACY_POLICY_URL.length === 0) {
    return;
  }
  try {
    const canOpen = await Linking.canOpenURL(PRIVACY_POLICY_URL);
    if (!canOpen) {
      return;
    }
    await Linking.openURL(PRIVACY_POLICY_URL);
  } catch {
    return;
  }
}

function PrivacyConsentLabel({
  disabled,
  onToggle,
}: {
  disabled: boolean;
  onToggle: () => void;
}) {
  const colors = getColors(useColorScheme());

  return (
    <AppText
      style={styles.consentLabel}
      onPress={disabled ? undefined : onToggle}
    >
      {copy.access.privacyAcceptLead}
      <AppText
        accessibilityRole="link"
        style={[styles.privacyLink, { color: colors.accent }]}
        onPress={
          disabled
            ? undefined
            : () => {
                void openPrivacyPolicy();
              }
        }
      >
        {copy.access.privacyPolicyLink}
      </AppText>
      {copy.access.privacyAcceptTail}
    </AppText>
  );
}

function BeforeStartCard() {
  const colors = getColors(useColorScheme());

  return (
    <Card variant="tinted" style={styles.infoCard}>
      <View style={styles.infoRow}>
        <AppIcon name="information-outline" color={colors.accent} size={20} />
        <Stack gap="sm" style={styles.infoCopy}>
          <AppText variant="label">{copy.access.beforeStartTitle}</AppText>
          {copy.access.beforeStartParagraphs.map((paragraph) => (
            <AppText key={paragraph} variant="caption" tone="secondary">
              {paragraph}
            </AppText>
          ))}
        </Stack>
      </View>
    </Card>
  );
}

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
            <View style={styles.heroCopy}>
              <ScreenHeader
                title={hasToken ? copy.access.consentTitle : intro.title}
                subtitle={hasToken ? copy.access.consentBody : intro.body}
              />
            </View>
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
            <>
              <BeforeStartCard />
              <Card variant="elevated">
                <Stack gap="md">
                  <CheckboxRow
                    label={copy.access.privacyAccept}
                    labelContent={
                      <PrivacyConsentLabel
                        disabled={busy}
                        onToggle={() => setPrivacyAccepted((value) => !value)}
                      />
                    }
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
                </Stack>
              </Card>
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
              <AppText variant="caption" tone="secondary" style={styles.note}>
                {copy.access.withdrawalNote}
              </AppText>
            </>
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
  heroCopy: {
    alignSelf: 'stretch',
  },
  infoCard: {
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  infoCopy: {
    flex: 1,
  },
  consentLabel: {
    flex: 1,
  },
  privacyLink: {
    textDecorationLine: 'underline',
  },
  note: {
    textAlign: 'center',
  },
  activating: {
    alignItems: 'center',
  },
});
