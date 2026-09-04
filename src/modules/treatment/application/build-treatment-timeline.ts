import {
  dayIndex,
  getCurrentPeriod,
  getPeriodDayNumber,
  isActiveTreatment,
  type CalendarDate,
  type Treatment,
  type TreatmentMilestone,
  type TreatmentPeriod,
} from '@/modules/treatment/domain';

/**
 * Treatment timeline read model.
 *
 * Milestone-to-period grouping uses civil-date windows as a temporary
 * fallback because TreatmentMilestone has no periodId in TASK-008.
 * Do not add periodId in this task. Future Supabase / clinic-side records
 * should store an explicit milestone-to-period relationship instead of
 * relying permanently on date-overlap heuristics.
 *
 * Overlap: if an ended period and a later period both contain occurredOn,
 * the ended period wins (a control visit closes that period).
 */
export type TimelineMilestone = {
  id: string;
  title?: string;
  occurredOn?: CalendarDate;
};

export type TimelinePeriod = {
  id: string;
  isCurrent: boolean;
  startedOn: CalendarDate;
  endedOn?: CalendarDate;
  milestones: readonly TimelineMilestone[];
};

export type TreatmentTimeline =
  | { kind: 'no_active_treatment' }
  | {
      kind: 'ready';
      patientId: string;
      treatmentId: string;
      periodDayNumber: number | null;
      currentPeriodId: string | null;
      periods: readonly TimelinePeriod[];
      ungroupedMilestones: readonly TimelineMilestone[];
    };

function periodContainsDate(period: TreatmentPeriod, date: CalendarDate): boolean {
  if (dayIndex(period.startedOn, date) < 0) {
    return false;
  }

  if (period.endedOn !== undefined && dayIndex(date, period.endedOn) < 0) {
    return false;
  }

  return true;
}

function pickPeriodForDate(
  periods: readonly TreatmentPeriod[],
  date: CalendarDate,
): TreatmentPeriod | null {
  const candidates = periods.filter((period) => periodContainsDate(period, date));
  const ended = candidates.filter((period) => period.endedOn !== undefined);
  const preferred = ended.length > 0 ? ended : candidates;

  let selected: TreatmentPeriod | null = null;
  for (const period of preferred) {
    if (selected === null || dayIndex(selected.startedOn, period.startedOn) > 0) {
      selected = period;
    }
  }

  return selected;
}

function mapMilestone(milestone: TreatmentMilestone): TimelineMilestone {
  const item: TimelineMilestone = { id: milestone.id };

  if (milestone.title !== undefined) {
    item.title = milestone.title;
  }

  if (milestone.occurredOn !== undefined) {
    item.occurredOn = milestone.occurredOn;
  }

  return item;
}

function toTimelinePeriod(
  period: TreatmentPeriod,
  isCurrent: boolean,
  milestones: readonly TimelineMilestone[],
): TimelinePeriod {
  const item: TimelinePeriod = {
    id: period.id,
    isCurrent,
    startedOn: period.startedOn,
    milestones,
  };

  if (period.endedOn !== undefined) {
    item.endedOn = period.endedOn;
  }

  return item;
}

function sortDatedMilestones(
  left: TimelineMilestone,
  right: TimelineMilestone,
): number {
  if (left.occurredOn === undefined || right.occurredOn === undefined) {
    return 0;
  }

  return dayIndex(right.occurredOn, left.occurredOn);
}

function sortUngrouped(
  milestones: readonly TimelineMilestone[],
): readonly TimelineMilestone[] {
  const dated = milestones
    .filter((milestone) => milestone.occurredOn !== undefined)
    .slice()
    .sort(sortDatedMilestones);
  const undated = milestones.filter((milestone) => milestone.occurredOn === undefined);

  return [...dated, ...undated];
}

export function buildTreatmentTimeline(
  treatment: Treatment | null,
  onDate: CalendarDate,
): TreatmentTimeline {
  if (treatment === null || !isActiveTreatment(treatment)) {
    return { kind: 'no_active_treatment' };
  }

  const currentPeriod = getCurrentPeriod(treatment);
  const periodDayNumber =
    currentPeriod === null ? null : getPeriodDayNumber(currentPeriod, onDate);

  const grouped = new Map<string, TimelineMilestone[]>();
  const ungrouped: TimelineMilestone[] = [];

  for (const milestone of treatment.milestones) {
    const mapped = mapMilestone(milestone);

    if (milestone.occurredOn === undefined) {
      ungrouped.push(mapped);
      continue;
    }

    const period = pickPeriodForDate(treatment.periods, milestone.occurredOn);
    if (period === null) {
      ungrouped.push(mapped);
      continue;
    }

    const list = grouped.get(period.id) ?? [];
    list.push(mapped);
    grouped.set(period.id, list);
  }

  for (const list of grouped.values()) {
    list.sort(sortDatedMilestones);
  }

  const periods: TimelinePeriod[] = [];

  if (currentPeriod !== null) {
    periods.push(
      toTimelinePeriod(currentPeriod, true, grouped.get(currentPeriod.id) ?? []),
    );
  }

  const previous = treatment.periods
    .filter((period) => currentPeriod === null || period.id !== currentPeriod.id)
    .filter((period) => (grouped.get(period.id) ?? []).length > 0)
    .slice()
    .sort((left, right) => dayIndex(left.startedOn, right.startedOn));

  for (const period of previous) {
    periods.push(toTimelinePeriod(period, false, grouped.get(period.id) ?? []));
  }

  return {
    kind: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    periodDayNumber,
    currentPeriodId: currentPeriod?.id ?? null,
    periods,
    ungroupedMilestones: sortUngrouped(ungrouped),
  };
}
