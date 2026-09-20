import {
  isActiveTreatment,
  isSameCalendarDate,
  type CalendarDate,
  type Treatment,
} from '@/modules/treatment/domain';

import type { DiaryEntry } from './types';

export function getDiaryEntryOnDate(
  entries: readonly DiaryEntry[],
  onDate: CalendarDate,
): DiaryEntry | undefined {
  return entries.find((entry) => isSameCalendarDate(entry.submittedOn, onDate));
}

export function hasDiaryEntryOnDate(
  entries: readonly DiaryEntry[],
  onDate: CalendarDate,
): boolean {
  return getDiaryEntryOnDate(entries, onDate) !== undefined;
}

export function isDiaryOpenOnDate(
  treatment: Treatment,
  entries: readonly DiaryEntry[],
  onDate: CalendarDate,
): boolean {
  return isActiveTreatment(treatment) && !hasDiaryEntryOnDate(entries, onDate);
}
