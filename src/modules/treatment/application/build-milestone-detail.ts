import {
  isActiveTreatment,
  type CalendarDate,
  type Treatment,
  type TreatmentMilestone,
} from '@/modules/treatment/domain';

export type MilestoneDetailItem = {
  id: string;
  title?: string;
  occurredOn?: CalendarDate;
};

export type MilestoneDetail =
  | { kind: 'not_found' }
  | {
      kind: 'ready';
      patientId: string;
      treatmentId: string;
      milestone: MilestoneDetailItem;
    };

function isBlankMilestoneId(milestoneId: string): boolean {
  return milestoneId.trim() === '';
}

function mapMilestone(milestone: TreatmentMilestone): MilestoneDetailItem {
  const item: MilestoneDetailItem = { id: milestone.id };

  if (milestone.title !== undefined) {
    item.title = milestone.title;
  }

  if (milestone.occurredOn !== undefined) {
    item.occurredOn = milestone.occurredOn;
  }

  return item;
}

export function buildMilestoneDetail(
  treatment: Treatment | null,
  milestoneId: string,
): MilestoneDetail {
  if (treatment === null || !isActiveTreatment(treatment) || isBlankMilestoneId(milestoneId)) {
    return { kind: 'not_found' };
  }

  const milestone = treatment.milestones.find((item) => item.id === milestoneId);

  if (milestone === undefined) {
    return { kind: 'not_found' };
  }

  return {
    kind: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    milestone: mapMilestone(milestone),
  };
}
