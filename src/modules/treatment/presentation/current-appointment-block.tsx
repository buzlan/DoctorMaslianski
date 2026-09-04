import { copy } from "@/shared/copy";
import { formatAppointmentAt } from "@/shared/date/format-appointment-at";
import { AppText, Stack } from "@/shared/ui";

import type { CurrentAppointmentView } from "../domain";

export function CurrentAppointmentBlock({
  appointment,
}: {
  appointment: CurrentAppointmentView | null;
}) {
  const formatted =
    appointment?.at !== undefined ? formatAppointmentAt(appointment.at) : null;

  return (
    <Stack gap="xs">
      <AppText variant="caption" tone="secondary">
        {copy.appointment.label}
      </AppText>
      {formatted !== null ? (
        <AppText>{formatted}</AppText>
      ) : (
        <AppText tone="secondary">{copy.appointment.empty}</AppText>
      )}
    </Stack>
  );
}
