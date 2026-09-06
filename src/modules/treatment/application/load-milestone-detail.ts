import { doctorPhotosForMilestone } from '@/modules/photos/domain';
import {
  sharedDoctorMilestonePhotoRepository,
  type DoctorMilestonePhotoRepository,
} from '@/modules/photos/infrastructure';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  buildMilestoneDetail,
  type MilestoneDetail,
  type MilestoneDoctorPhotoItem,
  type MilestoneDoctorPhotos,
} from './build-milestone-detail';

export type MilestoneDetailLoadResult =
  | { status: 'ready'; detail: Extract<MilestoneDetail, { kind: 'ready' }> }
  | { status: 'not_found' }
  | { status: 'error' };

async function loadDoctorPhotos(
  photoRepository: DoctorMilestonePhotoRepository,
  treatmentId: string,
  milestoneId: string,
): Promise<MilestoneDoctorPhotos> {
  try {
    const photos = await photoRepository.listPhotos(treatmentId);
    const matched = doctorPhotosForMilestone(photos, treatmentId, milestoneId);
    const items: MilestoneDoctorPhotoItem[] = [];

    for (const photo of matched) {
      try {
        const displayUri = await photoRepository.resolveDisplayUri(photo);
        if (displayUri !== null && displayUri.length > 0) {
          items.push({ id: photo.id, displayUri });
        }
      } catch {
        // Skip a single unresolvable photo. Do not fail the visit.
      }
    }

    return { status: 'ready', items };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function loadMilestoneDetail(
  repository: TreatmentRepository,
  photoRepository: DoctorMilestonePhotoRepository,
  milestoneId: string,
): Promise<MilestoneDetailLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const base = buildMilestoneDetail(treatment, milestoneId);

    if (base.kind === 'not_found') {
      return { status: 'not_found' };
    }

    const doctorPhotos = await loadDoctorPhotos(
      photoRepository,
      base.treatmentId,
      base.milestone.id,
    );

    return {
      status: 'ready',
      detail: { ...base, doctorPhotos },
    };
  } catch {
    return { status: 'error' };
  }
}

export function loadSharedMilestoneDetail(
  milestoneId: string,
): Promise<MilestoneDetailLoadResult> {
  return loadMilestoneDetail(
    sharedTreatmentRepository,
    sharedDoctorMilestonePhotoRepository,
    milestoneId,
  );
}
