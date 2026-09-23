import type { VasScore, Wellbeing } from "@/modules/diary/domain";

import {
  clampDiaryScale,
  diaryScaleFromTrackX,
  diaryScaleMarks,
  diaryScaleThumbCenter,
  DIARY_WELLBEING_VALUES,
  stepDiaryScale,
  toDiarySubmitAnswers,
  toVasScore,
} from "./diary-scale";

const TRACK_WIDTH = 300;

describe("pain scale", () => {
  it.each([0, 1, 5, 10])("keeps %s as an integer step", (score) => {
    expect(toVasScore(score)).toBe(score);
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(score, TRACK_WIDTH), TRACK_WIDTH)).toBe(
      score,
    );
  });
});

describe("swelling scale", () => {
  it.each([0, 1, 5, 10])("keeps %s as an integer step", (score) => {
    expect(toVasScore(score)).toBe(score);
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(score, TRACK_WIDTH), TRACK_WIDTH)).toBe(
      score,
    );
  });
});

describe("slider", () => {
  it("maps a tap to the integer under the touch", () => {
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(0, TRACK_WIDTH), TRACK_WIDTH)).toBe(0);
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(1, TRACK_WIDTH), TRACK_WIDTH)).toBe(1);
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(5, TRACK_WIDTH), TRACK_WIDTH)).toBe(5);
    expect(diaryScaleFromTrackX(diaryScaleThumbCenter(10, TRACK_WIDTH), TRACK_WIDTH)).toBe(10);
  });

  it("follows a drag with integer steps and clamps past the ends", () => {
    let previous = 0;
    for (let x = -40; x <= TRACK_WIDTH + 40; x += 5) {
      const value = diaryScaleFromTrackX(x, TRACK_WIDTH);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
    expect(diaryScaleFromTrackX(-40, TRACK_WIDTH)).toBe(0);
    expect(diaryScaleFromTrackX(TRACK_WIDTH + 40, TRACK_WIDTH)).toBe(10);
    expect(previous).toBe(10);
  });

  it("clamps non-integers and non-finite values onto 0..10", () => {
    expect(clampDiaryScale(-1)).toBe(0);
    expect(clampDiaryScale(11)).toBe(10);
    expect(clampDiaryScale(1.2)).toBe(1);
    expect(clampDiaryScale(4.5)).toBe(5);
    expect(clampDiaryScale(9.6)).toBe(10);
    expect(clampDiaryScale(Number.NaN)).toBe(0);
    expect(clampDiaryScale(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toVasScore(-3)).toBe(0);
    expect(toVasScore(14)).toBe(10);
    expect(toVasScore(5.4)).toBe(5);
  });

  it("shows even marks from 0 through 10", () => {
    expect(diaryScaleMarks()).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("steps by one and selects 0 from an empty value", () => {
    expect(stepDiaryScale(null, 1)).toBe(0);
    expect(stepDiaryScale(null, -1)).toBe(0);
    expect(stepDiaryScale(0, 1)).toBe(1);
    expect(stepDiaryScale(5, -1)).toBe(4);
    expect(stepDiaryScale(10, 1)).toBe(10);
    expect(stepDiaryScale(0, -1)).toBe(0);
  });
});

describe("diary submit answers", () => {
  it.each([0, 1, 5, 10] as const)("keeps pain %s in the existing payload", (pain) => {
    expect(toDiarySubmitAnswers(pain, 4, "unchanged")).toEqual({
      pain,
      swelling: 4,
      wellbeing: "unchanged",
    });
  });

  it.each([0, 1, 5, 10] as const)(
    "keeps swelling %s in the existing payload",
    (swelling) => {
      expect(toDiarySubmitAnswers(3, swelling, "unchanged")).toEqual({
        pain: 3,
        swelling,
        wellbeing: "unchanged",
      });
    },
  );

  it.each(["better", "unchanged", "worse"] as const)(
    "keeps wellbeing %s",
    (wellbeing: Wellbeing) => {
      expect(toDiarySubmitAnswers(2, 2, wellbeing)).toEqual({
        pain: 2,
        swelling: 2,
        wellbeing,
      });
    },
  );

  it("uses only pain, swelling, and wellbeing", () => {
    const answers = toDiarySubmitAnswers(1, 5, "better");
    expect(answers).not.toBeNull();
    expect(Object.keys(answers ?? {})).toEqual(["pain", "swelling", "wellbeing"]);
  });

  it("stays disabled until pain, swelling, and wellbeing are all set", () => {
    expect(toDiarySubmitAnswers(null, 1, "better")).toBeNull();
    expect(toDiarySubmitAnswers(1, null, "better")).toBeNull();
    expect(toDiarySubmitAnswers(1, 1, null)).toBeNull();
  });

  it("keeps the wellbeing domain values in order", () => {
    const values: readonly Wellbeing[] = DIARY_WELLBEING_VALUES;
    expect(values).toEqual(["better", "unchanged", "worse"]);
  });

  it("accepts the same VAS scores the grid used to persist", () => {
    const scores: readonly VasScore[] = [0, 1, 5, 10];
    for (const score of scores) {
      expect(toDiarySubmitAnswers(score, score, "worse")).toMatchObject({
        pain: score,
        swelling: score,
      });
    }
  });
});
