import {
  getAssignmentsForDate,
  getCurrentPeriod,
  getPeriodDayNumber,
  isActiveTreatment,
  isAssignmentCompletedOnDate,
  type CalendarDate,
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

export function buildTodayOverview(
  treatment: Treatment | null,
  onDate: CalendarDate,
): TodayOverview {
  if (treatment === null || !isActiveTreatment(treatment)) {
    return { kind: 'no_active_treatment' };
  }

  const currentPeriod = getCurrentPeriod(treatment);
  const periodDayNumber =
    currentPeriod === null ? null : getPeriodDayNumber(currentPeriod, onDate);

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
  };
}
