import { useRouter } from "expo-router";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import type { CurrentAppointmentView } from "@/modules/treatment/domain";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Card, IconWell, Stack } from "@/shared/ui";

import { formatTodayAppointmentLine } from "./format-today-appointment-line";

type TodayAppointmentCardProps = {
  appointment: CurrentAppointmentView;
};

export function TodayAppointmentCard({
  appointment,
}: TodayAppointmentCardProps) {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const line =
    appointment.at !== undefined
      ? formatTodayAppointmentLine(appointment.at)
      : null;

  if (line === null) {
    return null;
  }

  return (
    <Card variant="tinted" style={styles.card}>
      <View style={styles.row}>
        <IconWell name="calendar-outline" />
        <Stack gap="xs" style={styles.copy}>
          <AppText variant="label" tone="secondary">
            {copy.appointment.label}
          </AppText>
          <AppText variant="title" style={styles.when} numberOfLines={2}>
            {line}
          </AppText>
        </Stack>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.today.appointmentDetails}
          onPress={() => {
            router.navigate("/treatment");
          }}
          style={({ pressed }) => [
            styles.detailsButton,
            {
              borderColor: colors.accent,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <AppText variant="label" style={{ color: colors.accent }}>
            {copy.today.appointmentDetails}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  when: {
    fontWeight: "600",
  },
  detailsButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
