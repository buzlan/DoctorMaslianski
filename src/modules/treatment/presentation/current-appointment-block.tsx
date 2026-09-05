import { StyleSheet, View } from "react-native";

import { copy } from "@/shared/copy";
import { formatAppointmentAt } from "@/shared/date/format-appointment-at";
import { theme } from "@/shared/theme";
import { AppText, Card, IconWell, Stack } from "@/shared/ui";

import type { CurrentAppointmentView } from "../domain";

export function CurrentAppointmentBlock({
  appointment,
}: {
  appointment: CurrentAppointmentView | null;
}) {
  const formatted =
    appointment?.at !== undefined ? formatAppointmentAt(appointment.at) : null;

  return (
    <Card variant="tinted">
      <View style={styles.row}>
        <IconWell name="calendar-outline" />
        <Stack gap="xs" style={styles.copy}>
          <AppText variant="label" tone="secondary">
            {copy.appointment.label}
          </AppText>
          {formatted !== null ? (
            <AppText variant="title">{formatted}</AppText>
          ) : (
            <AppText tone="secondary">{copy.appointment.empty}</AppText>
          )}
        </Stack>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
  },
});
