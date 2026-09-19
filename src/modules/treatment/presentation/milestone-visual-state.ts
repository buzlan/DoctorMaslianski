import { dayIndex, type CalendarDate } from "@/modules/treatment/domain";

export type MilestoneVisualState = "past" | "current" | "upcoming" | "undated";

export function milestoneVisualState(
  occurredOn: CalendarDate | undefined,
  today: CalendarDate,
): MilestoneVisualState {
  if (occurredOn === undefined) {
    return "undated";
  }

  const delta = dayIndex(occurredOn, today);
  if (delta > 0) {
    return "past";
  }
  if (delta === 0) {
    return "current";
  }
  return "upcoming";
}
