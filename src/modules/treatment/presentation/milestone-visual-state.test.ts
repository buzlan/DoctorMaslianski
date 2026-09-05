import { calendarDate } from "@/modules/treatment/domain";

import { milestoneVisualState } from "./milestone-visual-state";

const TODAY = calendarDate(2026, 9, 5);

describe("milestoneVisualState", () => {
  it("returns undated when occurredOn is missing", () => {
    expect(milestoneVisualState(undefined, TODAY)).toBe("undated");
  });

  it("returns past when occurredOn is before today", () => {
    expect(milestoneVisualState(calendarDate(2026, 9, 1), TODAY)).toBe("past");
  });

  it("returns current when occurredOn is today", () => {
    expect(milestoneVisualState(TODAY, TODAY)).toBe("current");
  });

  it("returns upcoming when occurredOn is after today", () => {
    expect(milestoneVisualState(calendarDate(2026, 9, 12), TODAY)).toBe(
      "upcoming",
    );
  });
});
