import type { CalendarDate } from '@/modules/treatment/domain';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatCalendarDate(date: CalendarDate): string {
  return `${pad2(date.day)}.${pad2(date.month)}.${date.year}`;
}
