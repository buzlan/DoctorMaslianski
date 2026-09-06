import {
  isSameCalendarDate,
  type CalendarDate,
} from '@/modules/treatment/domain';

import type { DiaryEntry, VasScore, Wellbeing } from '../domain';

export type DiaryHistoryItem = {
  id: string;
  submittedOn: CalendarDate;
  pain: VasScore;
  swelling: VasScore;
  wellbeing: Wellbeing;
};

export function buildDiaryHistory(
  entries: readonly DiaryEntry[],
  options: { excludeDate?: CalendarDate } = {},
): readonly DiaryHistoryItem[] {
  const excluded = options.excludeDate;
  const filtered =
    excluded === undefined
      ? entries
      : entries.filter((entry) => !isSameCalendarDate(entry.submittedOn, excluded));

  return toNewestFirst(filtered.map(toHistoryItem));
}

export function toNewestFirst(
  items: readonly DiaryHistoryItem[],
): readonly DiaryHistoryItem[] {
  return [...items].sort(
    (left, right) => -compareCivilDate(left.submittedOn, right.submittedOn),
  );
}

function toHistoryItem(entry: DiaryEntry): DiaryHistoryItem {
  return {
    id: entry.id,
    submittedOn: {
      year: entry.submittedOn.year,
      month: entry.submittedOn.month,
      day: entry.submittedOn.day,
    },
    pain: entry.pain,
    swelling: entry.swelling,
    wellbeing: entry.wellbeing,
  };
}

function compareCivilDate(left: CalendarDate, right: CalendarDate): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}
