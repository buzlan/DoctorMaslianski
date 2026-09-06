import type { TimelinePeriod } from "@/modules/treatment/application";
import { calendarDate } from "@/modules/treatment/domain";

import {
  currentTimelinePeriod,
  previousPeriodsChronological,
  sortMilestonesChronologically,
  timelineConnectorKind,
} from "./timeline-sections";

const oldest: TimelinePeriod = {
  id: "oldest",
  isCurrent: false,
  startedOn: calendarDate(2026, 5, 1),
  endedOn: calendarDate(2026, 5, 31),
  milestones: [],
};

const middle: TimelinePeriod = {
  id: "middle",
  isCurrent: false,
  startedOn: calendarDate(2026, 6, 1),
  endedOn: calendarDate(2026, 6, 30),
  milestones: [],
};

const current: TimelinePeriod = {
  id: "current",
  isCurrent: true,
  startedOn: calendarDate(2026, 8, 1),
  milestones: [],
};

describe("sortMilestonesChronologically", () => {
  it("orders dated milestones ascending and keeps undated last", () => {
    expect(
      sortMilestonesChronologically([
        { id: "undated" },
        { id: "later", occurredOn: calendarDate(2026, 9, 12) },
        { id: "earlier", occurredOn: calendarDate(2026, 9, 1) },
        { id: "today", occurredOn: calendarDate(2026, 9, 5) },
      ]).map((milestone) => milestone.id),
    ).toEqual(["earlier", "today", "later", "undated"]);
  });
});

describe("previousPeriodsChronological", () => {
  it("returns historical periods oldest first", () => {
    expect(
      previousPeriodsChronological([current, middle, oldest]).map(
        (period) => period.id,
      ),
    ).toEqual(["oldest", "middle"]);
  });
});

describe("currentTimelinePeriod", () => {
  it("returns the open current period", () => {
    expect(currentTimelinePeriod([current, middle])?.id).toBe("current");
  });
});

describe("timelineConnectorKind", () => {
  it("keeps past and current stretches solid blue", () => {
    expect(timelineConnectorKind("past", "past")).toBe("solid");
    expect(timelineConnectorKind("past", "current")).toBe("solid");
    expect(timelineConnectorKind("current", "upcoming")).toBe("solid");
  });

  it("uses a dashed future/undated segment", () => {
    expect(timelineConnectorKind("upcoming", "upcoming")).toBe("dashed");
    expect(timelineConnectorKind("undated", "undated")).toBe("dashed");
    expect(timelineConnectorKind("past", "upcoming")).toBe("dashed");
  });
});
