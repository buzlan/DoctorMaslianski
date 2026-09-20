import { StyleSheet, useColorScheme, View } from "react-native";

import type { ClinicContact } from "@/modules/clinic-contact";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Card, Stack } from "@/shared/ui";

export function AppointmentContactSection({
  contact = {},
}: {
  contact?: ClinicContact;
}) {
  const hasContactDetails =
    contact.phone !== undefined || contact.email !== undefined;
  const colors = getColors(useColorScheme());

  return (
    <Card variant="elevated">
      <Stack gap="md">
        <View style={styles.header}>
          <View
            style={[
              styles.infoIcon,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.accent,
              },
            ]}
          >
            <AppText style={{ color: colors.accent, fontWeight: "700" }}>
              i
            </AppText>
          </View>

          <Stack gap="xs" style={styles.copy}>
            <AppText variant="title">{copy.appointment.contactTitle}</AppText>

            <AppText variant="caption" tone="secondary">
              {copy.appointment.contactBody}
            </AppText>
          </Stack>
        </View>

        {hasContactDetails ? (
          <Stack gap="xs">
            {contact.phone !== undefined ? (
              <View style={styles.contactRow}>
                <AppText variant="label" tone="secondary">
                  {copy.appointment.phoneLabel}
                </AppText>
                <AppText>{contact.phone}</AppText>
              </View>
            ) : null}

            {contact.email !== undefined ? (
              <View style={styles.contactRow}>
                <AppText variant="label" tone="secondary">
                  {copy.appointment.emailLabel}
                </AppText>
                <AppText>{contact.email}</AppText>
              </View>
            ) : null}
          </Stack>
        ) : (
          <AppText tone="secondary">
            {copy.appointment.contactsUnavailable}
          </AppText>
        )}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  contactRow: {
    gap: theme.spacing.xs,
  },
});
