import { createDiaryEntry, type DiaryEntry } from '../domain';
import { parseCivilDate } from '@/shared/date/civil-date';
import type { WriteOutboxItem } from '@/core/sync/write-outbox';

export type RemoteDiaryEntryRow = {
  id: string;
  treatment_id: string;
  patient_id: string;
  submitted_on: string;
  pain: number;
  swelling: number;
  wellbeing: 'better' | 'unchanged' | 'worse';
};

export type DiaryOutboxPayload = {
  treatmentId: string;
  patientId: string;
  submittedOn: string;
  pain: number;
  swelling: number;
  wellbeing: 'better' | 'unchanged' | 'worse';
};

export function mapRemoteDiaryEntry(row: RemoteDiaryEntryRow): DiaryEntry | null {
  const submittedOn = parseCivilDate(row.submitted_on);
  if (submittedOn === null) {
    return null;
  }

  try {
    return createDiaryEntry({
      treatmentId: row.treatment_id,
      patientId: row.patient_id,
      submittedOn,
      answers: {
        pain: row.pain,
        swelling: row.swelling,
        wellbeing: row.wellbeing,
      },
    });
  } catch {
    return null;
  }
}

export function applyDiaryOutbox(
  entries: readonly DiaryEntry[],
  items: readonly WriteOutboxItem<DiaryOutboxPayload>[],
  authUserId: string,
  treatmentId: string,
): DiaryEntry[] {
  const next = [...entries];

  for (const item of items) {
    if (item.authUserId !== authUserId || item.treatmentId !== treatmentId) {
      continue;
    }

    const submittedOn = parseCivilDate(item.payload.submittedOn);
    if (submittedOn === null) {
      continue;
    }

    const exists = next.some(
      (entry) =>
        entry.submittedOn.year === submittedOn.year &&
        entry.submittedOn.month === submittedOn.month &&
        entry.submittedOn.day === submittedOn.day,
    );
    if (exists) {
      continue;
    }

    const mapped = mapRemoteDiaryEntry({
      id: item.id,
      treatment_id: item.payload.treatmentId,
      patient_id: item.payload.patientId,
      submitted_on: item.payload.submittedOn,
      pain: item.payload.pain,
      swelling: item.payload.swelling,
      wellbeing: item.payload.wellbeing,
    });
    if (mapped !== null) {
      next.push(mapped);
    }
  }

  return next;
}
