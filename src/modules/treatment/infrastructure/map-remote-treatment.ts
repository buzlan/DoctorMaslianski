import {
  calendarDate,
  completionIdFor,
  createTreatment,
  isSameCalendarDate,
  type ActionAssignment,
  type ActionCompletion,
  type Appointment,
  type CalendarDate,
  type Treatment,
  type TreatmentMilestone,
  type TreatmentPeriod,
} from '@/modules/treatment/domain';
import { formatCivilDate, parseCivilDate } from '@/shared/date/civil-date';

import type { WriteOutboxItem } from '@/core/sync/write-outbox';

export type RemoteTreatmentRow = {
  id: string;
  patient_id: string;
  treatment_context: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
};

export type RemotePeriodRow = {
  id: string;
  started_on: string;
  ended_on: string | null;
};

export type RemoteMilestoneRow = {
  id: string;
  title: string;
  kind: string | null;
  occurred_on: string | null;
};

export type RemoteAssignmentRow = {
  id: string;
  catalog_item_id: string;
  title: string;
  instruction: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'disabled';
};

export type RemoteCompletionRow = {
  id: string;
  assignment_id: string;
  completed_on: string;
};

export type RemoteAppointmentRow = {
  id: string;
  wall_clock: string;
  status: 'current' | 'superseded';
};

export type CompletionOutboxPayload =
  | { op: 'insert'; assignmentId: string; completedOn: string }
  | { op: 'delete'; assignmentId: string; completedOn: string };

export function selectCurrentTreatment<
  T extends { status: string; created_at: string; id: string },
>(rows: readonly T[]): T | null {
  const active = rows.filter((row) => row.status === 'active');
  const pool = active.length > 0 ? active : [...rows];
  if (pool.length === 0) {
    return null;
  }

  return pool.sort(compareCreatedAtDesc)[0] ?? null;
}

function compareCreatedAtDesc(
  left: { created_at: string; id: string },
  right: { created_at: string; id: string },
): number {
  if (left.created_at !== right.created_at) {
    return left.created_at < right.created_at ? 1 : -1;
  }

  return left.id < right.id ? 1 : -1;
}

export function wallClockToAppointmentAt(wallClock: string): string | undefined {
  const trimmed = wallClock.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.replace(' ', 'T').replace(/Z$/i, '');
}

export function mapRemoteTreatment(input: {
  treatment: RemoteTreatmentRow;
  periods: readonly RemotePeriodRow[];
  milestones: readonly RemoteMilestoneRow[];
  assignments: readonly RemoteAssignmentRow[];
  completions: readonly RemoteCompletionRow[];
  appointments: readonly RemoteAppointmentRow[];
}): Treatment {
  return createTreatment({
    id: input.treatment.id,
    patientId: input.treatment.patient_id,
    status: input.treatment.status,
    periods: input.periods.map(mapPeriod),
    milestones: input.milestones.map(mapMilestone),
    assignments: input.assignments.map(mapAssignment),
    completions: input.completions.map(mapCompletion),
    appointments: input.appointments.map(mapAppointment),
  });
}

function mapPeriod(row: RemotePeriodRow): TreatmentPeriod {
  const period: TreatmentPeriod = {
    id: row.id,
    startedOn: requireCivilDate(row.started_on),
  };

  if (row.ended_on !== null) {
    period.endedOn = requireCivilDate(row.ended_on);
  }

  return period;
}

function mapMilestone(row: RemoteMilestoneRow): TreatmentMilestone {
  const milestone: TreatmentMilestone = {
    id: row.id,
    title: row.title,
  };

  if (row.kind !== null && row.kind.length > 0) {
    milestone.kind = row.kind;
  }

  if (row.occurred_on !== null) {
    milestone.occurredOn = requireCivilDate(row.occurred_on);
  }

  return milestone;
}

function mapAssignment(row: RemoteAssignmentRow): ActionAssignment {
  const assignment: ActionAssignment = {
    id: row.id,
    catalogItemId: row.catalog_item_id,
    title: row.title,
    startDate: requireCivilDate(row.start_date),
    endDate: requireCivilDate(row.end_date),
    status: row.status,
  };

  if (row.instruction !== null && row.instruction.length > 0) {
    assignment.instruction = row.instruction;
  }

  return assignment;
}

function mapCompletion(row: RemoteCompletionRow): ActionCompletion {
  const completedOn = requireCivilDate(row.completed_on);
  return {
    id: completionIdFor(row.assignment_id, completedOn),
    assignmentId: row.assignment_id,
    completedOn,
  };
}

function mapAppointment(row: RemoteAppointmentRow): Appointment {
  const appointment: Appointment = {
    id: row.id,
    status: row.status,
  };

  const at = wallClockToAppointmentAt(row.wall_clock);
  if (at !== undefined) {
    appointment.at = at;
  }

  return appointment;
}

export function applyCompletionOutbox(
  completions: readonly ActionCompletion[],
  items: readonly WriteOutboxItem<CompletionOutboxPayload>[],
  authUserId: string,
  treatmentId: string,
): ActionCompletion[] {
  let next = [...completions];

  for (const item of items) {
    if (item.authUserId !== authUserId || item.treatmentId !== treatmentId) {
      continue;
    }

    const onDate = parseCivilDate(item.payload.completedOn);
    if (onDate === null) {
      continue;
    }

    if (item.payload.op === 'insert') {
      const exists = next.some(
        (completion) =>
          completion.assignmentId === item.payload.assignmentId &&
          isSameCalendarDate(completion.completedOn, onDate),
      );
      if (!exists) {
        next.push({
          id: completionIdFor(item.payload.assignmentId, onDate),
          assignmentId: item.payload.assignmentId,
          completedOn: onDate,
        });
      }
      continue;
    }

    next = next.filter(
      (completion) =>
        !(
          completion.assignmentId === item.payload.assignmentId &&
          isSameCalendarDate(completion.completedOn, onDate)
        ),
    );
  }

  return next;
}

export function civilDateString(onDate: CalendarDate): string {
  return formatCivilDate(onDate);
}

function requireCivilDate(value: string): CalendarDate {
  const parsed = parseCivilDate(value);
  if (parsed === null) {
    return calendarDate(1970, 1, 1);
  }

  return parsed;
}
