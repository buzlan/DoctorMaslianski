import type { DiaryRepository } from '@/modules/diary/infrastructure';
import {
  DEVELOPMENT_PILOT_COHORT,
  type ProductEventSink,
} from '@/modules/product-events';
import type { CalendarDate, PilotCohort } from '@/modules/treatment/domain';
import type {
  CompleteAssignmentResult,
  TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { loadTodayOverview, type TodayLoadResult } from './load-today-overview';

export type CompleteTodayAssignmentDeps = {
  repository: TreatmentRepository;
  diaryRepository: DiaryRepository;
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
};

export async function completeTodayAssignment(
  deps: CompleteTodayAssignmentDeps,
  assignmentId: string,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  let result: CompleteAssignmentResult;

  try {
    result = await deps.repository.completeAssignment(assignmentId, onDate);
  } catch {
    return loadTodayOverview(deps.repository, deps.diaryRepository, onDate);
  }

  if (result.status === 'recorded' && !result.alreadyPresent) {
    const now = deps.now ?? (() => new Date());
    const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
    await deps.eventSink.append({
      name: 'task_completed',
      at: now().toISOString(),
      pilotCohort,
      patientId: result.patientId,
      treatmentId: result.treatmentId,
      entityId: assignmentId,
    });
  }

  return loadTodayOverview(deps.repository, deps.diaryRepository, onDate);
}

export async function uncompleteTodayAssignment(
  deps: { repository: TreatmentRepository; diaryRepository: DiaryRepository },
  assignmentId: string,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  try {
    await deps.repository.uncompleteAssignment(assignmentId, onDate);
  } catch {
    // Persist failed; in-memory completion state is unchanged.
  }

  return loadTodayOverview(deps.repository, deps.diaryRepository, onDate);
}
