import type {
  ActionCompletion,
  AssignmentCompletionIgnoredReason,
  CalendarDate,
  Treatment,
} from '../domain';

export type CompleteAssignmentResult =
  | {
      status: 'recorded';
      completion: ActionCompletion;
      alreadyPresent: boolean;
      patientId: string;
      treatmentId: string;
    }
  | {
      status: 'ignored';
      reason: AssignmentCompletionIgnoredReason;
    };

export type UncompleteAssignmentResult =
  | {
      status: 'cleared';
      alreadyAbsent: boolean;
    }
  | {
      status: 'ignored';
      reason: AssignmentCompletionIgnoredReason;
    };

export type TreatmentRepository = {
  getActiveTreatment(): Promise<Treatment | null>;
  completeAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<CompleteAssignmentResult>;
  uncompleteAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<UncompleteAssignmentResult>;
};
