import { formatTodayAppointmentLine } from "./format-today-appointment-line";

describe("formatTodayAppointmentLine", () => {
  it("formats wall-clock date without timezone conversion", () => {
    expect(formatTodayAppointmentLine("2026-09-26T09:00:00")).toBe(
      "26 сентября · 09:00",
    );
    expect(formatTodayAppointmentLine("2026-05-23T10:00:00.000Z")).toBe(
      "23 мая · 10:00",
    );
  });

  it("returns null for invalid values", () => {
    expect(formatTodayAppointmentLine("not-a-date")).toBeNull();
  });
});
