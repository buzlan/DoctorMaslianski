import { isActiveTreatment, type CalendarDate, type Treatment } from '@/modules/treatment/domain';

import { createDiaryEntry } from './create-diary-entry';
import { getDiaryEntryOnDate } from './helpers';
import type { DiaryEntry } from './types';

export type RecordDiaryEntryResult =
  | {
      status: 'recorded';
      entry: DiaryEntry;
      alreadyPresent: boolean;
      entries: readonly DiaryEntry[];
    }
  | {
      status: 'ignored';
      reason: 'no_active_treatment';
    };

export function recordDiaryEntry(input: {
  treatment: Treatment;
  existingEntries: readonly DiaryEntry[];
  onDate: CalendarDate;
  answers: unknown;
}): RecordDiaryEntryResult {
  if (!isActiveTreatment(input.treatment)) {
    return { status: 'ignored', reason: 'no_active_treatment' };
  }

  const existing = getDiaryEntryOnDate(input.existingEntries, input.onDate);
  if (existing !== undefined) {
    return {
      status: 'recorded',
      entry: existing,
      alreadyPresent: true,
      entries: input.existingEntries,
    };
  }

  const entry = createDiaryEntry({
    treatmentId: input.treatment.id,
    patientId: input.treatment.patientId,
    submittedOn: input.onDate,
    answers: input.answers,
  });

  return {
    status: 'recorded',
    entry,
    alreadyPresent: false,
    entries: [...input.existingEntries, entry],
  };
}
