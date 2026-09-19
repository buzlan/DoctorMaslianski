export { calendarDate, dayIndex, isSameCalendarDate } from './calendar-date';
export type { CalendarDate } from './calendar-date';

export {
  getAssignmentsForDate,
  getCurrentAppointment,
  getCurrentPeriod,
  getPeriodDayNumber,
  isActiveTreatment,
  isAssignmentActiveOnDate,
  isAssignmentCompletedOnDate,
  isDateInInclusiveRange,
  toCurrentAppointmentView,
} from './helpers';

export { createTreatment } from './create-treatment';
export type { CreateTreatmentInput } from './create-treatment';

export {
  clearAssignmentCompletion,
  completionIdFor,
  recordAssignmentCompletion,
} from './complete-assignment';
export type {
  AssignmentCompletionIgnoredReason,
  ClearAssignmentCompletionResult,
  RecordAssignmentCompletionResult,
} from './complete-assignment';

export type {
  ActionAssignment,
  ActionAssignmentStatus,
  ActionCompletion,
  Appointment,
  AppointmentRecordStatus,
  CurrentAppointmentView,
  Patient,
  PilotCohort,
  Treatment,
  TreatmentContext,
  TreatmentMilestone,
  TreatmentPeriod,
  TreatmentStatus,
} from './types';
