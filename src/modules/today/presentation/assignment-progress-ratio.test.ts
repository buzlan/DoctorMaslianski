import {
  clampAssignmentCounts,
  getTaskProgress,
  progressToStrokeDashoffset,
} from "./assignment-progress-ratio";

describe("clampAssignmentCounts", () => {
  it("keeps 0/0 visible as zeros without NaN", () => {
    expect(clampAssignmentCounts(0, 0)).toEqual({ completed: 0, total: 0 });
    expect(clampAssignmentCounts(2, 0)).toEqual({ completed: 0, total: 0 });
  });

  it("clamps completed into [0, total]", () => {
    expect(clampAssignmentCounts(-1, 3)).toEqual({ completed: 0, total: 3 });
    expect(clampAssignmentCounts(5, 3)).toEqual({ completed: 3, total: 3 });
    expect(clampAssignmentCounts(2, 3)).toEqual({ completed: 2, total: 3 });
  });
});

describe("getTaskProgress", () => {
  it("covers 0/0 and single-task cases", () => {
    expect(getTaskProgress(0, 0)).toBe(0);
    expect(getTaskProgress(0, 1)).toBe(0);
    expect(getTaskProgress(1, 1)).toBe(1);
  });

  it("covers 2-task cases", () => {
    expect(getTaskProgress(0, 2)).toBe(0);
    expect(getTaskProgress(1, 2)).toBe(0.5);
    expect(getTaskProgress(2, 2)).toBe(1);
  });

  it("covers 3-task cases", () => {
    expect(getTaskProgress(0, 3)).toBe(0);
    expect(getTaskProgress(1, 3)).toBeCloseTo(1 / 3);
    expect(getTaskProgress(2, 3)).toBeCloseTo(2 / 3);
    expect(getTaskProgress(3, 3)).toBe(1);
  });

  it("covers 4-task cases including 3/4 = 75%", () => {
    expect(getTaskProgress(0, 4)).toBe(0);
    expect(getTaskProgress(1, 4)).toBe(0.25);
    expect(getTaskProgress(2, 4)).toBe(0.5);
    expect(getTaskProgress(3, 4)).toBe(0.75);
    expect(getTaskProgress(4, 4)).toBe(1);
  });

  it("covers 5-task and 7/10 cases", () => {
    expect(getTaskProgress(1, 5)).toBe(0.2);
    expect(getTaskProgress(2, 5)).toBe(0.4);
    expect(getTaskProgress(3, 5)).toBe(0.6);
    expect(getTaskProgress(4, 5)).toBe(0.8);
    expect(getTaskProgress(5, 5)).toBe(1);
    expect(getTaskProgress(7, 10)).toBe(0.7);
  });

  it("clamps invalid completed/total", () => {
    expect(getTaskProgress(-1, 4)).toBe(0);
    expect(getTaskProgress(5, 4)).toBe(1);
    expect(getTaskProgress(2, 0)).toBe(0);
    expect(getTaskProgress(2, -3)).toBe(0);
  });
});

describe("progressToStrokeDashoffset", () => {
  const circumference = 2 * Math.PI * 34;

  it("maps unit progress to dash offset", () => {
    expect(progressToStrokeDashoffset(0, circumference)).toBeCloseTo(
      circumference,
    );
    expect(progressToStrokeDashoffset(0.25, circumference)).toBeCloseTo(
      circumference * 0.75,
    );
    expect(progressToStrokeDashoffset(0.5, circumference)).toBeCloseTo(
      circumference * 0.5,
    );
    expect(progressToStrokeDashoffset(0.75, circumference)).toBeCloseTo(
      circumference * 0.25,
    );
    expect(progressToStrokeDashoffset(1, circumference)).toBeCloseTo(0);
  });
});
