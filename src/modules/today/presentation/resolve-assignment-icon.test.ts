import {
  ASSIGNMENT_ICON_FALLBACK,
  ASSIGNMENT_ICON_POOL,
  resolveAssignmentIcon,
} from "./resolve-assignment-icon";

describe("resolveAssignmentIcon", () => {
  it("uses a known iconKey when provided", () => {
    expect(
      resolveAssignmentIcon({
        assignmentId: "a-1",
        iconKey: "calendar-outline",
      }),
    ).toBe("calendar-outline");
  });

  it("falls back for an unknown iconKey", () => {
    expect(
      resolveAssignmentIcon({
        assignmentId: "a-1",
        iconKey: "pill",
      }),
    ).toBe(ASSIGNMENT_ICON_FALLBACK);
  });

  it("picks a stable pool icon from assignment id", () => {
    const first = resolveAssignmentIcon({ assignmentId: "assignment-stable" });
    const second = resolveAssignmentIcon({ assignmentId: "assignment-stable" });
    expect(first).toBe(second);
    expect(ASSIGNMENT_ICON_POOL).toContain(first);
  });

  it("does not rely on title text", () => {
    const byId = resolveAssignmentIcon({ assignmentId: "x-9" });
    expect(byId).toBe(
      resolveAssignmentIcon({ assignmentId: "x-9", iconKey: undefined }),
    );
  });
});
