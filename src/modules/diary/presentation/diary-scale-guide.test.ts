import { DIARY_SCALE_GUIDE_STEPS } from "./diary-scale-guide";

describe("diary scale guide", () => {
  it("shows the five reference ranges and captions", () => {
    expect(DIARY_SCALE_GUIDE_STEPS.map((step) => step.range)).toEqual([
      "0",
      "1–3",
      "4–6",
      "7–9",
      "10",
    ]);
    expect(DIARY_SCALE_GUIDE_STEPS.map((step) => step.label)).toEqual([
      "Нет боли",
      "Слабая боль",
      "Умеренная боль",
      "Очень сильная боль",
      "Нестерпимая боль",
    ]);
  });
});
