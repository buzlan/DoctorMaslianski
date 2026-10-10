import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { copy } from '@/shared/copy';
import { theme } from '@/shared/theme';
import { AppText, Button, Card, Stack } from '@/shared/ui';

import { CLINIC_WEBSITE_URL, PUBLIC_CLINIC_PHONES } from '../public-clinic';

async function openHref(href: string): Promise<boolean> {
  try {
    await Linking.openURL(href);
    return true;
  } catch {
    return false;
  }
}

export function PublicClinicContact() {
  const [openFailed, setOpenFailed] = useState(false);

  async function open(href: string) {
    setOpenFailed(false);
    const opened = await openHref(href);
    if (!opened) {
      setOpenFailed(true);
    }
  }

  return (
    <Card variant="elevated">
      <Stack gap="md">
        <AppText variant="title" accessibilityRole="header">
          {copy.clinicContact.label}
        </AppText>
        <AppText tone="secondary">{copy.clinicContact.siteBody}</AppText>
        <Stack gap="xs">
          <AppText variant="label" tone="secondary">
            {copy.appointment.phonesTitle}
          </AppText>
          {PUBLIC_CLINIC_PHONES.map((phone) => (
            <Pressable
              key={phone.id}
              accessibilityRole="link"
              accessibilityLabel={`${copy.appointment.call}, ${copy.appointment[phone.labelKey]}: ${phone.display}`}
              onPress={() => {
                void open(`tel:${phone.dial}`);
              }}
            >
              <View style={styles.phoneRow}>
                <AppText variant="caption" tone="secondary" style={styles.phoneLabel}>
                  {copy.appointment[phone.labelKey]}
                </AppText>
                <AppText style={styles.phoneNumber}>{phone.display}</AppText>
              </View>
            </Pressable>
          ))}
        </Stack>
        <Stack gap="xs">
          <AppText variant="label" tone="secondary">
            {copy.appointment.clinicTitle}
          </AppText>
          <AppText>{copy.appointment.clinicName}</AppText>
          <AppText tone="secondary">{copy.appointment.clinicAddress}</AppText>
        </Stack>
        <Button
          variant="primary"
          label={copy.clinicContact.siteAction}
          accessibilityLabel={copy.clinicContact.siteAction}
          onPress={() => {
            void open(CLINIC_WEBSITE_URL);
          }}
        />
        {openFailed ? <AppText tone="secondary">{copy.clinicContact.openError}</AppText> : null}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  phoneLabel: {
    width: 88,
  },
  phoneNumber: {
    flexShrink: 1,
    color: theme.colors.light.accent,
  },
});
