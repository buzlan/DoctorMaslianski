export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  const daysByMonth = [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysByMonth[month - 1];
}

export function calendarDate(year: number, month: number, day: number): CalendarDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('CalendarDate fields must be integers.');
  }

  if (month < 1 || month > 12) {
    throw new Error('CalendarDate month must be between 1 and 12.');
  }

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new Error('CalendarDate day is not valid for the given year and month.');
  }

  return { year, month, day };
}

function toJulianDay({ year, month, day }: CalendarDate): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function dayIndex(start: CalendarDate, onDate: CalendarDate): number {
  return toJulianDay(onDate) - toJulianDay(start);
}
