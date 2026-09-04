import type { CalendarDate } from '@/modules/treatment/domain';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  buildTreatmentTimeline,
  type TreatmentTimeline,
} from './build-treatment-timeline';

export type TreatmentTimelineLoadResult =
  | { status: 'ready'; timeline: Extract<TreatmentTimeline, { kind: 'ready' }> }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

export async function loadTreatmentTimeline(
  repository: TreatmentRepository,
  onDate: CalendarDate,
): Promise<TreatmentTimelineLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const timeline = buildTreatmentTimeline(treatment, onDate);

    if (timeline.kind === 'no_active_treatment') {
      return { status: 'no_active_treatment' };
    }

    return { status: 'ready', timeline };
  } catch {
    return { status: 'error' };
  }
}

export function loadSharedTreatmentTimeline(
  onDate: CalendarDate,
): Promise<TreatmentTimelineLoadResult> {
  return loadTreatmentTimeline(sharedTreatmentRepository, onDate);
}
