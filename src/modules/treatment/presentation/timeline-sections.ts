import type {
  TimelineMilestone,
  TimelinePeriod,
} from "@/modules/treatment/application";
import { dayIndex } from "@/modules/treatment/domain";

import type { MilestoneVisualState } from "./milestone-visual-state";

export function sortMilestonesChronologically(
  milestones: readonly TimelineMilestone[],
): readonly TimelineMilestone[] {
  const dated = milestones
    .filter((milestone) => milestone.occurredOn !== undefined)
    .slice()
    .sort((left, right) => {
      if (left.occurredOn === undefined || right.occurredOn === undefined) {
        return 0;
      }

      return dayIndex(right.occurredOn, left.occurredOn);
    });
  const undated = milestones.filter(
    (milestone) => milestone.occurredOn === undefined,
  );

  return [...dated, ...undated];
}

export function previousPeriodsChronological(
  periods: readonly TimelinePeriod[],
): readonly TimelinePeriod[] {
  return periods
    .filter((period) => !period.isCurrent)
    .slice()
    .sort((left, right) => dayIndex(right.startedOn, left.startedOn));
}

export function currentTimelinePeriod(
  periods: readonly TimelinePeriod[],
): TimelinePeriod | undefined {
  return periods.find((period) => period.isCurrent);
}

export function timelineConnectorKind(
  state: MilestoneVisualState,
  nextState: MilestoneVisualState | undefined,
): "solid" | "dashed" {
  if (nextState === undefined) {
    return "dashed";
  }

  if (state === "upcoming" || state === "undated") {
    return "dashed";
  }

  if (nextState === "upcoming" || nextState === "undated") {
    return state === "current" ? "solid" : "dashed";
  }

  return "solid";
}
