import {
  DEVELOPMENT_PILOT_COHORT,
  type ProductEventSink,
} from '@/modules/product-events';
import type { CalendarDate, PilotCohort } from '@/modules/treatment/domain';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import { loadTodayOverview, type TodayLoadResult } from './load-today-overview';

export type CompleteTodayAssignmentDeps = {
  repository: TreatmentRepository;
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
};

export async function completeTodayAssignment(
  deps: CompleteTodayAssignmentDeps,
  assignmentId: string,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  const result = await deps.repository.completeAssignment(assignmentId, onDate);

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

  return loadTodayOverview(deps.repository, onDate);
}

export async function uncompleteTodayAssignment(
  deps: { repository: TreatmentRepository },
  assignmentId: string,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  await deps.repository.uncompleteAssignment(assignmentId, onDate);
  return loadTodayOverview(deps.repository, onDate);
}
