import type { CalendarDate } from './calendar-date';

export type TreatmentContext = 'sclerotherapy';

export type PilotCohort = 'internal_dry_run' | 'closed_beta' | 'clinic_pilot';

export type TreatmentStatus = 'active' | 'completed' | 'cancelled';

export type ActionAssignmentStatus = 'active' | 'disabled';

export type AppointmentRecordStatus = 'current' | 'superseded';

export type Patient = {
  id: string;
  cohort?: PilotCohort;
  privacyAcceptedAt?: string;
  pilotConsentAcceptedAt?: string;
  consentDocumentVersion?: string;
};

export type TreatmentPeriod = {
  id: string;
  startedOn: CalendarDate;
  endedOn?: CalendarDate;
};

export type TreatmentMilestone = {
  id: string;
  kind?: string;
  title?: string;
  occurredOn?: CalendarDate;
};

export type ActionAssignment = {
  id: string;
  catalogItemId: string;
  title?: string;
  instruction?: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
  status: ActionAssignmentStatus;
};

export type ActionCompletion = {
  id: string;
  assignmentId: string;
  completedOn: CalendarDate;
};

export type Appointment = {
  id: string;
  /**
   * Clinic-authored ISO datetime. Patient display uses the wall-clock
   * date/time from this string. Do not convert through the device timezone.
   */
  at?: string;
  status: AppointmentRecordStatus;
};

export type CurrentAppointmentView = {
  id: string;
  at?: string;
};

export type Treatment = {
  id: string;
  patientId: string;
  treatmentContext: TreatmentContext;
  status: TreatmentStatus;
  periods: readonly TreatmentPeriod[];
  milestones: readonly TreatmentMilestone[];
  assignments: readonly ActionAssignment[];
  completions: readonly ActionCompletion[];
  appointments: readonly Appointment[];
};
