import { dayIndex, isSameCalendarDate } from './calendar-date';
import type { CalendarDate } from './calendar-date';
import type {
  ActionAssignment,
  Appointment,
  CurrentAppointmentView,
  Treatment,
  TreatmentPeriod,
} from './types';

export function getCurrentPeriod(treatment: Treatment): TreatmentPeriod | null {
  let current: TreatmentPeriod | null = null;

  for (const period of treatment.periods) {
    if (period.endedOn !== undefined) {
      continue;
    }

    if (current === null || dayIndex(current.startedOn, period.startedOn) > 0) {
      current = period;
    }
  }

  return current;
}

export function getPeriodDayNumber(
  period: TreatmentPeriod,
  onDate: CalendarDate,
): number | null {
  if (dayIndex(period.startedOn, onDate) < 0) {
    return null;
  }

  if (period.endedOn !== undefined && dayIndex(onDate, period.endedOn) < 0) {
    return null;
  }

  return 1 + dayIndex(period.startedOn, onDate);
}

export function isDateInInclusiveRange(
  onDate: CalendarDate,
  startDate: CalendarDate,
  endDate: CalendarDate,
): boolean {
  return dayIndex(startDate, onDate) >= 0 && dayIndex(onDate, endDate) >= 0;
}

export function isAssignmentActiveOnDate(
  assignment: ActionAssignment,
  onDate: CalendarDate,
): boolean {
  return (
    assignment.status === 'active' &&
    isDateInInclusiveRange(onDate, assignment.startDate, assignment.endDate)
  );
}

export function getAssignmentsForDate(
  treatment: Treatment,
  onDate: CalendarDate,
): readonly ActionAssignment[] {
  return treatment.assignments.filter((assignment) =>
    isAssignmentActiveOnDate(assignment, onDate),
  );
}

export function isAssignmentCompletedOnDate(
  treatment: Treatment,
  assignmentId: string,
  onDate: CalendarDate,
): boolean {
  return treatment.completions.some(
    (completion) =>
      completion.assignmentId === assignmentId &&
      isSameCalendarDate(completion.completedOn, onDate),
  );
}

export function isActiveTreatment(treatment: Treatment): boolean {
  return treatment.status === 'active';
}

function appointmentInstant(at: string | undefined): number | null {
  if (at === undefined) {
    return null;
  }

  const ms = Date.parse(at);
  return Number.isNaN(ms) ? null : ms;
}

function isPreferredCurrentAppointment(candidate: Appointment, current: Appointment): boolean {
  const candidateAt = appointmentInstant(candidate.at);
  const currentAt = appointmentInstant(current.at);

  if (candidateAt !== null && (currentAt === null || candidateAt > currentAt)) {
    return true;
  }

  if (candidateAt === currentAt && candidate.id < current.id) {
    return true;
  }

  return false;
}

export function getCurrentAppointment(treatment: Treatment): Appointment | null {
  const current = treatment.appointments.filter((row) => row.status === 'current');

  if (current.length === 0) {
    return null;
  }

  let selected = current[0];
  if (selected === undefined) {
    return null;
  }

  for (const row of current.slice(1)) {
    if (isPreferredCurrentAppointment(row, selected)) {
      selected = row;
    }
  }

  return selected;
}

export function toCurrentAppointmentView(
  appointment: Appointment | null,
): CurrentAppointmentView | null {
  if (appointment === null) {
    return null;
  }

  const view: CurrentAppointmentView = { id: appointment.id };

  if (appointment.at !== undefined) {
    view.at = appointment.at;
  }

  return view;
}
