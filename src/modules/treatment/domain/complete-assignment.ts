import { isSameCalendarDate } from './calendar-date';
import type { CalendarDate } from './calendar-date';
import {
  isActiveTreatment,
  isAssignmentActiveOnDate,
  isAssignmentCompletedOnDate,
} from './helpers';
import type { ActionCompletion, Treatment } from './types';

export type AssignmentCompletionIgnoredReason =
  | 'no_active_treatment'
  | 'assignment_not_completable_on_date';

export type RecordAssignmentCompletionResult =
  | {
      status: 'recorded';
      treatment: Treatment;
      completion: ActionCompletion;
      alreadyPresent: boolean;
    }
  | {
      status: 'ignored';
      reason: AssignmentCompletionIgnoredReason;
    };

export type ClearAssignmentCompletionResult =
  | {
      status: 'cleared';
      treatment: Treatment;
      alreadyAbsent: boolean;
    }
  | {
      status: 'ignored';
      reason: AssignmentCompletionIgnoredReason;
    };

export function completionIdFor(assignmentId: string, onDate: CalendarDate): string {
  return `${assignmentId}:${onDate.year}-${onDate.month}-${onDate.day}`;
}

function copyCalendarDate(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: date.day };
}

function findCompletionOnDate(
  treatment: Treatment,
  assignmentId: string,
  onDate: CalendarDate,
): ActionCompletion | undefined {
  return treatment.completions.find(
    (completion) =>
      completion.assignmentId === assignmentId &&
      isSameCalendarDate(completion.completedOn, onDate),
  );
}

function completableReason(
  treatment: Treatment,
  assignmentId: string,
  onDate: CalendarDate,
): AssignmentCompletionIgnoredReason | null {
  if (!isActiveTreatment(treatment)) {
    return 'no_active_treatment';
  }

  const assignment = treatment.assignments.find((item) => item.id === assignmentId);
  if (assignment === undefined || !isAssignmentActiveOnDate(assignment, onDate)) {
    return 'assignment_not_completable_on_date';
  }

  return null;
}

export function recordAssignmentCompletion(
  treatment: Treatment,
  assignmentId: string,
  onDate: CalendarDate,
): RecordAssignmentCompletionResult {
  const reason = completableReason(treatment, assignmentId, onDate);
  if (reason !== null) {
    return { status: 'ignored', reason };
  }

  const existing = findCompletionOnDate(treatment, assignmentId, onDate);
  if (existing !== undefined) {
    return {
      status: 'recorded',
      treatment,
      completion: existing,
      alreadyPresent: true,
    };
  }

  const completion: ActionCompletion = {
    id: completionIdFor(assignmentId, onDate),
    assignmentId,
    completedOn: copyCalendarDate(onDate),
  };

  return {
    status: 'recorded',
    treatment: {
      ...treatment,
      completions: [...treatment.completions, completion],
    },
    completion,
    alreadyPresent: false,
  };
}

export function clearAssignmentCompletion(
  treatment: Treatment,
  assignmentId: string,
  onDate: CalendarDate,
): ClearAssignmentCompletionResult {
  const reason = completableReason(treatment, assignmentId, onDate);
  if (reason !== null) {
    return { status: 'ignored', reason };
  }

  if (!isAssignmentCompletedOnDate(treatment, assignmentId, onDate)) {
    return {
      status: 'cleared',
      treatment,
      alreadyAbsent: true,
    };
  }

  return {
    status: 'cleared',
    treatment: {
      ...treatment,
      completions: treatment.completions.filter(
        (completion) =>
          !(
            completion.assignmentId === assignmentId &&
            isSameCalendarDate(completion.completedOn, onDate)
          ),
      ),
    },
    alreadyAbsent: false,
  };
}
