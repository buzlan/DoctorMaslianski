import type { CalendarDate, Treatment } from '@/modules/treatment/domain';

import type { DiaryEntry } from '../domain';

export type SubmitDiaryEntryResult =
  | {
      status: 'recorded';
      entry: DiaryEntry;
      alreadyPresent: boolean;
    }
  | {
      status: 'ignored';
      reason: 'no_active_treatment';
    };

export type DiaryRepository = {
  listEntries(treatmentId: string): Promise<readonly DiaryEntry[]>;
  getEntryOnDate(treatmentId: string, onDate: CalendarDate): Promise<DiaryEntry | null>;
  submitEntry(
    treatment: Treatment,
    onDate: CalendarDate,
    answers: { pain: number; swelling: number; wellbeing: string },
  ): Promise<SubmitDiaryEntryResult>;
};
