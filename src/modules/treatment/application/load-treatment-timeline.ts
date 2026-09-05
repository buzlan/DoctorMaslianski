import { doctorPhotosForMilestone } from '@/modules/photos/domain';
import {
  sharedDoctorMilestonePhotoRepository,
  type DoctorMilestonePhotoRepository,
} from '@/modules/photos/infrastructure';
import type { CalendarDate } from '@/modules/treatment/domain';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  buildTreatmentTimeline,
  type TimelineMilestone,
  type TimelinePeriod,
  type TreatmentTimeline,
} from './build-treatment-timeline';

export type TreatmentTimelineLoadResult =
  | { status: 'ready'; timeline: Extract<TreatmentTimeline, { kind: 'ready' }> }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

type ReadyTimeline = Extract<TreatmentTimeline, { kind: 'ready' }>;

function withDoctorPhotoCount(
  milestone: TimelineMilestone,
  count: number,
): TimelineMilestone {
  if (count <= 0) {
    return milestone;
  }

  return { ...milestone, doctorPhotoCount: count };
}

function attachDoctorPhotoCounts(
  timeline: ReadyTimeline,
  countsByMilestoneId: ReadonlyMap<string, number>,
): ReadyTimeline {
  const mapMilestone = (milestone: TimelineMilestone): TimelineMilestone =>
    withDoctorPhotoCount(milestone, countsByMilestoneId.get(milestone.id) ?? 0);

  const periods: TimelinePeriod[] = timeline.periods.map((period) => ({
    ...period,
    milestones: period.milestones.map(mapMilestone),
  }));

  return {
    ...timeline,
    periods,
    ungroupedMilestones: timeline.ungroupedMilestones.map(mapMilestone),
  };
}

async function loadDoctorPhotoCounts(
  photoRepository: DoctorMilestonePhotoRepository,
  treatmentId: string,
): Promise<ReadonlyMap<string, number>> {
  const photos = await photoRepository.listPhotos(treatmentId);
  const counts = new Map<string, number>();

  for (const photo of photos) {
    const matched = doctorPhotosForMilestone(photos, treatmentId, photo.milestoneId);
    counts.set(photo.milestoneId, matched.length);
  }

  return counts;
}

export async function loadTreatmentTimeline(
  repository: TreatmentRepository,
  onDate: CalendarDate,
  photoRepository?: DoctorMilestonePhotoRepository,
): Promise<TreatmentTimelineLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const timeline = buildTreatmentTimeline(treatment, onDate);

    if (timeline.kind === 'no_active_treatment') {
      return { status: 'no_active_treatment' };
    }

    if (photoRepository === undefined) {
      return { status: 'ready', timeline };
    }

    try {
      const counts = await loadDoctorPhotoCounts(photoRepository, timeline.treatmentId);
      return { status: 'ready', timeline: attachDoctorPhotoCounts(timeline, counts) };
    } catch {
      return { status: 'ready', timeline };
    }
  } catch {
    return { status: 'error' };
  }
}

export function loadSharedTreatmentTimeline(
  onDate: CalendarDate,
): Promise<TreatmentTimelineLoadResult> {
  return loadTreatmentTimeline(
    sharedTreatmentRepository,
    onDate,
    sharedDoctorMilestonePhotoRepository,
  );
}
