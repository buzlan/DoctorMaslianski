import { calendarDate } from '@/modules/treatment/domain';

import { formatCalendarDate } from './format-calendar-date';

describe('formatCalendarDate', () => {
  it('formats as dd.mm.yyyy', () => {
    expect(formatCalendarDate(calendarDate(2026, 8, 19))).toBe('19.08.2026');
    expect(formatCalendarDate(calendarDate(2026, 1, 5))).toBe('05.01.2026');
  });
});
