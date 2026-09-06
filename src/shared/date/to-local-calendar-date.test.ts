import { toLocalCalendarDate } from './to-local-calendar-date';

describe('toLocalCalendarDate', () => {
  it('uses local year, month, and day, not UTC conversion', () => {
    const lateLocalEvening = new Date(2026, 7, 19, 23, 30, 0);

    expect(toLocalCalendarDate(lateLocalEvening)).toEqual({
      year: 2026,
      month: 8,
      day: 19,
    });
  });

  it('keeps the local civil date when UTC getters would differ', () => {
    const earlyLocalMorning = new Date(2026, 7, 19, 0, 30, 0);
    const result = toLocalCalendarDate(earlyLocalMorning);

    expect(result).toEqual({ year: 2026, month: 8, day: 19 });
    expect(result.day).toBe(earlyLocalMorning.getDate());
    expect(result.day).not.toBeUndefined();

    if (earlyLocalMorning.getUTCDate() !== 19) {
      expect(result.day).not.toBe(earlyLocalMorning.getUTCDate());
    }
  });
});
