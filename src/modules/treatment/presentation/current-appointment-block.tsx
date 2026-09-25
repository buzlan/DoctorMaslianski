import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { copy } from "@/shared/copy";
import { formatAppointmentAt } from "@/shared/date/format-appointment-at";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, AppText, Card, IconWell, Stack } from "@/shared/ui";

import type { CurrentAppointmentView } from "../domain";

type CurrentAppointmentBlockProps = {
  appointment: CurrentAppointmentView | null;
  onPressDetails: () => void;
};

export function CurrentAppointmentBlock({
  appointment,
  onPressDetails,
}: CurrentAppointmentBlockProps) {
  const colors = getColors(useColorScheme());
  const hasAppointment = appointment !== null;

  const formatted =
    appointment?.at !== undefined ? formatAppointmentAt(appointment.at) : null;

  return (
    <Pressable
      disabled={!hasAppointment}
      accessibilityRole={hasAppointment ? "button" : undefined}
      accessibilityLabel={
        hasAppointment
          ? [
              copy.appointment.label,
              formatted ?? copy.appointment.empty,
              copy.appointment.contactTitle,
              copy.appointment.details,
            ].join(". ")
          : copy.appointment.empty
      }
      onPress={onPressDetails}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.84 : 1 },
      ]}
    >
      <Card variant="tinted" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <IconWell name="calendar-outline" size={48} />
          </View>

          <View style={styles.content}>
            <Stack gap="xs">
              <AppText variant="caption" tone="secondary">
                {copy.appointment.label}
              </AppText>

              {formatted !== null ? (
                <AppText variant="title" tone="primary" style={styles.date}>
                  {formatted}
                </AppText>
              ) : (
                <AppText variant="caption" tone="secondary">
                  {copy.appointment.empty}
                </AppText>
              )}
            </Stack>

            {hasAppointment ? (
              <AppText
                variant="caption"
                style={[styles.contactHint, { color: colors.accent }]}
              >
                {copy.appointment.contactTitle}
              </AppText>
            ) : null}
          </View>

          {hasAppointment ? (
            <View
              style={styles.chevron}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <AppIcon name="chevron-right" size={20} color={colors.accent} />
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexShrink: 0,
  },
  card: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  appointmentText: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontFamily: theme.typography.title.fontFamily,
  },
  contactHint: {
    marginTop: theme.spacing.xs,
  },
  chevron: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
