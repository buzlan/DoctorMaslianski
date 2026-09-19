import {
  getAssignmentsForDate,
  getCurrentAppointment,
  getCurrentPeriod,
  getPeriodDayNumber,
  isActiveTreatment,
  isAssignmentCompletedOnDate,
  toCurrentAppointmentView,
  type CalendarDate,
  type CurrentAppointmentView,
  type Treatment,
} from '@/modules/treatment/domain';

export type TodayAssignmentItem = {
  id: string;
  completed: boolean;
  title?: string;
  instruction?: string;
};

export type TodayOverview =
  | { kind: 'no_active_treatment' }
  | {
      kind: 'ready';
      patientId: string;
      treatmentId: string;
      periodDayNumber: number | null;
      assignments: readonly TodayAssignmentItem[];
      diaryOpen: boolean;
      photosRecordedToday: 0 | 1 | 2 | 3;
      photoAddOpen: boolean;
      currentAppointment: CurrentAppointmentView | null;
    };

function mapAssignment(
  assignment: {
    id: string;
    title?: string;
    instruction?: string;
  },
  completed: boolean,
): TodayAssignmentItem {
  const item: TodayAssignmentItem = { id: assignment.id, completed };

  if (assignment.title !== undefined) {
    item.title = assignment.title;
  }

  if (assignment.instruction !== undefined) {
    item.instruction = assignment.instruction;
  }

  return item;
}

function clampPhotoCount(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count === 2) {
    return 2;
  }
  return 3;
}

export function buildTodayOverview(
  treatment: Treatment | null,
  onDate: CalendarDate,
  todayDiaryEntryExists = false,
  photosRecordedToday = 0,
): TodayOverview {
  if (treatment === null || !isActiveTreatment(treatment)) {
    return { kind: 'no_active_treatment' };
  }

  const currentPeriod = getCurrentPeriod(treatment);
  const periodDayNumber =
    currentPeriod === null ? null : getPeriodDayNumber(currentPeriod, onDate);
  const recorded = clampPhotoCount(photosRecordedToday);

  return {
    kind: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    periodDayNumber,
    assignments: getAssignmentsForDate(treatment, onDate).map((assignment) =>
      mapAssignment(
        assignment,
        isAssignmentCompletedOnDate(treatment, assignment.id, onDate),
      ),
    ),
    diaryOpen: !todayDiaryEntryExists,
    photosRecordedToday: recorded,
    photoAddOpen: recorded < 3,
    currentAppointment: toCurrentAppointmentView(getCurrentAppointment(treatment)),
  };
}
