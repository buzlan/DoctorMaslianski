import type { CalendarDate } from './calendar-date';
import type {
  ActionAssignment,
  ActionCompletion,
  Appointment,
  Treatment,
  TreatmentMilestone,
  TreatmentPeriod,
  TreatmentStatus,
} from './types';

export type CreateTreatmentInput = {
  id: string;
  patientId: string;
  status?: TreatmentStatus;
  periods?: readonly TreatmentPeriod[];
  milestones?: readonly TreatmentMilestone[];
  assignments?: readonly ActionAssignment[];
  completions?: readonly ActionCompletion[];
  appointments?: readonly Appointment[];
};

function copyCalendarDate(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: date.day };
}

function copyPeriod(period: TreatmentPeriod): TreatmentPeriod {
  const copied: TreatmentPeriod = {
    id: period.id,
    startedOn: copyCalendarDate(period.startedOn),
  };

  if (period.endedOn !== undefined) {
    copied.endedOn = copyCalendarDate(period.endedOn);
  }

  return copied;
}

function copyMilestone(milestone: TreatmentMilestone): TreatmentMilestone {
  const copied: TreatmentMilestone = {
    id: milestone.id,
  };

  if (milestone.kind !== undefined) {
    copied.kind = milestone.kind;
  }
  if (milestone.title !== undefined) {
    copied.title = milestone.title;
  }
  if (milestone.occurredOn !== undefined) {
    copied.occurredOn = copyCalendarDate(milestone.occurredOn);
  }

  return copied;
}

function copyAssignment(assignment: ActionAssignment): ActionAssignment {
  const copied: ActionAssignment = {
    id: assignment.id,
    catalogItemId: assignment.catalogItemId,
    startDate: copyCalendarDate(assignment.startDate),
    endDate: copyCalendarDate(assignment.endDate),
    status: assignment.status,
  };

  if (assignment.title !== undefined) {
    copied.title = assignment.title;
  }
  if (assignment.instruction !== undefined) {
    copied.instruction = assignment.instruction;
  }

  return copied;
}

function copyCompletion(completion: ActionCompletion): ActionCompletion {
  return {
    id: completion.id,
    assignmentId: completion.assignmentId,
    completedOn: copyCalendarDate(completion.completedOn),
  };
}

function copyAppointment(appointment: Appointment): Appointment {
  const copied: Appointment = {
    id: appointment.id,
    status: appointment.status,
  };

  if (appointment.at !== undefined) {
    copied.at = appointment.at;
  }

  return copied;
}

export function createTreatment(input: CreateTreatmentInput): Treatment {
  return {
    id: input.id,
    patientId: input.patientId,
    treatmentContext: 'sclerotherapy',
    status: input.status ?? 'active',
    periods: (input.periods ?? []).map(copyPeriod),
    milestones: (input.milestones ?? []).map(copyMilestone),
    assignments: (input.assignments ?? []).map(copyAssignment),
    completions: (input.completions ?? []).map(copyCompletion),
    appointments: (input.appointments ?? []).map(copyAppointment),
  };
}
