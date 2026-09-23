import type { VasScore, Wellbeing } from "@/modules/diary/domain";

export const DIARY_SCALE_MIN = 0;
export const DIARY_SCALE_MAX = 10;

const VAS_SCORES: readonly VasScore[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function clampDiaryScale(
  value: number,
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
): number {
  "worklet";
  if (!Number.isFinite(value)) {
    return min;
  }
  const rounded = Math.round(value);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
}

/** Thumb center along a track, from the left edge to the right edge. */
export function diaryScaleThumbCenter(
  value: number,
  trackWidth: number,
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
): number {
  "worklet";
  const width = Math.max(trackWidth, 0);
  const clamped = clampDiaryScale(value, min, max);
  const steps = max - min;
  if (steps === 0) {
    return 0;
  }
  return ((clamped - min) / steps) * width;
}

/**
 * Maps a horizontal touch (tap or drag) to an integer step.
 * Touches outside the track clamp to the ends.
 */
export function diaryScaleFromTrackX(
  x: number,
  trackWidth: number,
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
): number {
  "worklet";
  const width = Math.max(trackWidth, 0);
  if (width <= 0 || !Number.isFinite(x)) {
    return min;
  }
  const clampedX = Math.min(width, Math.max(0, x));
  const ratio = clampedX / width;
  return clampDiaryScale(min + ratio * (max - min), min, max);
}

export function diaryScaleMarks(
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
): number[] {
  const marks: number[] = [];
  for (let value = min; value <= max; value += 2) {
    marks.push(value);
  }
  return marks;
}

export function toVasScore(value: number): VasScore {
  const score = clampDiaryScale(value);
  const match = VAS_SCORES.find((item) => item === score);
  return match ?? 0;
}

/** First accessibility step from an empty slider selects the minimum. */
export function stepDiaryScale(
  current: number | null,
  delta: 1 | -1,
  min = DIARY_SCALE_MIN,
  max = DIARY_SCALE_MAX,
): number {
  if (current === null) {
    return min;
  }
  return clampDiaryScale(current + delta, min, max);
}

export const DIARY_WELLBEING_VALUES = [
  "better",
  "unchanged",
  "worse",
] as const satisfies readonly Wellbeing[];

export function toDiarySubmitAnswers(
  pain: VasScore | null,
  swelling: VasScore | null,
  wellbeing: Wellbeing | null,
): { pain: VasScore; swelling: VasScore; wellbeing: Wellbeing } | null {
  if (pain === null || swelling === null || wellbeing === null) {
    return null;
  }
  return { pain, swelling, wellbeing };
}
