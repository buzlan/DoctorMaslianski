import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

export function toLocalCalendarDate(date: Date): CalendarDate {
  return calendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
