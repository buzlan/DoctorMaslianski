import type { CalendarDate } from '@/modules/treatment/domain';
import { calendarDate } from '@/modules/treatment/domain';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatCivilDate(date: CalendarDate): string {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function parseCivilDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match === null) {
    return null;
  }

  try {
    return calendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
  } catch {
    return null;
  }
}
