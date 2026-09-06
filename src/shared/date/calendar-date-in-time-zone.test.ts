import { calendarDateInTimeZone } from '@/shared/date/calendar-date-in-time-zone';

describe('calendarDateInTimeZone', () => {
  it('uses the named timezone civil date, not the device local date', () => {
    const utcInstant = new Date('2026-09-04T22:30:00.000Z');

    expect(calendarDateInTimeZone(utcInstant, 'UTC')).toEqual({
      year: 2026,
      month: 9,
      day: 4,
    });
    expect(calendarDateInTimeZone(utcInstant, 'Europe/Minsk')).toEqual({
      year: 2026,
      month: 9,
      day: 5,
    });
  });
});
