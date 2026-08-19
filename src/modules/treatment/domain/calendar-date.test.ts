import { calendarDate, dayIndex } from './calendar-date';

describe('calendarDate', () => {
  it('accepts a valid civil date', () => {
    expect(calendarDate(2026, 8, 19)).toEqual({ year: 2026, month: 8, day: 19 });
  });

  it('rejects February 30', () => {
    expect(() => calendarDate(2026, 2, 30)).toThrow();
  });

  it('rejects a non-leap February 29', () => {
    expect(() => calendarDate(2027, 2, 29)).toThrow();
  });

  it('accepts a leap-year February 29', () => {
    expect(calendarDate(2028, 2, 29)).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe('dayIndex', () => {
  it('returns 0 for the same date', () => {
    const date = calendarDate(2026, 8, 19);
    expect(dayIndex(date, date)).toBe(0);
  });

  it('returns 1 for the next day', () => {
    expect(dayIndex(calendarDate(2026, 8, 19), calendarDate(2026, 8, 20))).toBe(1);
  });

  it('returns -1 for the previous day', () => {
    expect(dayIndex(calendarDate(2026, 8, 19), calendarDate(2026, 8, 18))).toBe(-1);
  });

  it('crosses a month boundary', () => {
    expect(dayIndex(calendarDate(2026, 1, 31), calendarDate(2026, 2, 1))).toBe(1);
  });

  it('counts one day from 2028-02-28 to 2028-02-29', () => {
    expect(dayIndex(calendarDate(2028, 2, 28), calendarDate(2028, 2, 29))).toBe(1);
  });

  it('counts one day from 2028-02-29 to 2028-03-01', () => {
    expect(dayIndex(calendarDate(2028, 2, 29), calendarDate(2028, 3, 1))).toBe(1);
  });
});
