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

/**
 * Today header progress card. Present only when a current treatment period exists.
 * periodTitle / periodDescription are copied from period fields when the domain
 * provides them; they are never invented from day number or medical heuristics.
 */
export type TodayPeriodProgress = {
  periodDayNumber: number | null;
  completedAssignments: number;
  totalAssignments: number;
  periodTitle?: string;
  periodDescription?: string;
};

export type TodayOverview =
  | { kind: 'no_active_treatment' }
  | {
      kind: 'ready';
      patientId: string;
      treatmentId: string;
      periodDayNumber: number | null;
      periodProgress: TodayPeriodProgress | null;
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

function buildPeriodProgress(
  currentPeriod: ReturnType<typeof getCurrentPeriod>,
  periodDayNumber: number | null,
  assignments: readonly TodayAssignmentItem[],
): TodayPeriodProgress | null {
  if (currentPeriod === null) {
    return null;
  }

  const progress: TodayPeriodProgress = {
    periodDayNumber,
    completedAssignments: assignments.filter((item) => item.completed).length,
    totalAssignments: assignments.length,
  };

  // TreatmentPeriod has no clinic title in the current domain/schema.
  // When a real period title exists on the loaded period record, copy it here
  // only — never invent medical stage names from day number or heuristics.
  const periodRecord = currentPeriod as {
    title?: string;
    description?: string;
  };
  if (
    typeof periodRecord.title === "string" &&
    periodRecord.title.trim().length > 0
  ) {
    progress.periodTitle = periodRecord.title.trim();
  }
  if (
    typeof periodRecord.description === "string" &&
    periodRecord.description.trim().length > 0
  ) {
    progress.periodDescription = periodRecord.description.trim();
  }

  return progress;
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
  const assignments = getAssignmentsForDate(treatment, onDate).map((assignment) =>
    mapAssignment(
      assignment,
      isAssignmentCompletedOnDate(treatment, assignment.id, onDate),
    ),
  );

  return {
    kind: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    periodDayNumber,
    periodProgress: buildPeriodProgress(currentPeriod, periodDayNumber, assignments),
    assignments,
    diaryOpen: !todayDiaryEntryExists,
    photosRecordedToday: recorded,
    photoAddOpen: recorded < 3,
    currentAppointment: toCurrentAppointmentView(getCurrentAppointment(treatment)),
  };
}
