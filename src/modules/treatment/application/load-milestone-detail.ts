import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  buildMilestoneDetail,
  type MilestoneDetail,
} from './build-milestone-detail';

export type MilestoneDetailLoadResult =
  | { status: 'ready'; detail: Extract<MilestoneDetail, { kind: 'ready' }> }
  | { status: 'not_found' }
  | { status: 'error' };

export async function loadMilestoneDetail(
  repository: TreatmentRepository,
  milestoneId: string,
): Promise<MilestoneDetailLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const detail = buildMilestoneDetail(treatment, milestoneId);

    if (detail.kind === 'not_found') {
      return { status: 'not_found' };
    }

    return { status: 'ready', detail };
  } catch {
    return { status: 'error' };
  }
}

export function loadSharedMilestoneDetail(
  milestoneId: string,
): Promise<MilestoneDetailLoadResult> {
  return loadMilestoneDetail(sharedTreatmentRepository, milestoneId);
}
