/** Clamp a progress share to the closed unit interval. */
export function clampUnitProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }
  if (progress <= 0) {
    return 0;
  }
  if (progress >= 1) {
    return 1;
  }
  return progress;
}

/** Clamp completed into [0, total] with finite-safe totals. */
export function clampAssignmentCounts(
  completed: number,
  total: number,
): { completed: number; total: number } {
  const safeTotal =
    Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  if (safeTotal <= 0) {
    return { completed: 0, total: 0 };
  }
  const raw = Number.isFinite(completed) ? completed : 0;
  const safeCompleted = Math.min(safeTotal, Math.max(0, Math.floor(raw)));
  return { completed: safeCompleted, total: safeTotal };
}

/**
 * Completed/total → unit progress for the Today ring.
 * Only source of truth for ring fill. Never divides by zero.
 */
export function getTaskProgress(completed: number, total: number): number {
  const counts = clampAssignmentCounts(completed, total);
  if (counts.total <= 0) {
    return 0;
  }
  return clampUnitProgress(counts.completed / counts.total);
}

/** @deprecated Prefer getTaskProgress — same math. */
export function assignmentProgressRatio(
  completed: number,
  total: number,
): number {
  return getTaskProgress(completed, total);
}

/**
 * SVG circle strokeDashoffset for a progress share in [0, 1].
 * progress 0 → circumference (empty), progress 1 → 0 (full).
 */
export function progressToStrokeDashoffset(
  progress: number,
  circumference: number,
): number {
  return circumference * (1 - clampUnitProgress(progress));
}

/** @deprecated Prefer progressToStrokeDashoffset — same math. */
export function progressStrokeDashoffset(
  progress: number,
  circumference: number,
): number {
  return progressToStrokeDashoffset(progress, circumference);
}
