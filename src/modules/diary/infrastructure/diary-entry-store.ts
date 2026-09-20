/**
 * Local-at-rest boundary for DiaryEntry rows.
 *
 * Separate from CompletionOverlayStore. Do not store diary answers in the
 * assignment-completion overlay or in unencrypted AsyncStorage.
 *
 * The TASK-012 SecureStore adapter is a temporary development / internal
 * dry-run restart mechanism. It is not the final storage architecture for
 * real-patient clinical data. Supabase and privacy/security review remain
 * required before real-patient rollout.
 */

import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import { createDiaryEntry, InvalidDiaryEntryError, type DiaryEntry } from '../domain';

export type DiaryEntryStore = {
  load(treatmentId: string): Promise<readonly DiaryEntry[]>;
  save(treatmentId: string, entries: readonly DiaryEntry[]): Promise<void>;
};

export const DIARY_ENTRY_STORE_VERSION = 1;

export type DiaryIndexEnvelope = {
  version: typeof DIARY_ENTRY_STORE_VERSION;
  treatmentId: string;
  dates: readonly string[];
};

export type DiaryEntryEnvelope = {
  version: typeof DIARY_ENTRY_STORE_VERSION;
  treatmentId: string;
  entry: DiaryEntry;
};

const COMPACT_DATE = /^\d{8}$/;
const STORAGE_KEY_SAFE = /[^A-Za-z0-9._-]/g;

export function sanitizeStorageKeyPart(value: string): string {
  return value.replace(STORAGE_KEY_SAFE, '_');
}

export function compactCivilDate(date: CalendarDate): string {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}${month}${day}`;
}

export function parseCompactCivilDate(value: string): CalendarDate | null {
  if (!COMPACT_DATE.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));

  try {
    return calendarDate(year, month, day);
  } catch {
    return null;
  }
}

export function diaryIndexStorageKey(treatmentId: string): string {
  return `diary.v1.index.${sanitizeStorageKeyPart(treatmentId)}`;
}

export function diaryEntryStorageKey(treatmentId: string, onDate: CalendarDate): string {
  return `diary.v1.entry.${sanitizeStorageKeyPart(treatmentId)}.${compactCivilDate(onDate)}`;
}

export function serializeDiaryIndex(
  treatmentId: string,
  entries: readonly DiaryEntry[],
): string {
  const dates = uniqueSortedDates(entries.map((entry) => compactCivilDate(entry.submittedOn)));
  const envelope: DiaryIndexEnvelope = {
    version: DIARY_ENTRY_STORE_VERSION,
    treatmentId,
    dates,
  };
  return JSON.stringify(envelope);
}

export function parseDiaryIndex(raw: string | null, treatmentId: string): readonly string[] {
  if (raw === null || raw === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isRecord(parsed)) {
    return [];
  }

  if (parsed.version !== DIARY_ENTRY_STORE_VERSION) {
    return [];
  }

  if (parsed.treatmentId !== treatmentId) {
    return [];
  }

  if (!Array.isArray(parsed.dates)) {
    return [];
  }

  const dates: string[] = [];
  for (const item of parsed.dates) {
    if (typeof item !== 'string') {
      continue;
    }
    if (parseCompactCivilDate(item) === null) {
      continue;
    }
    if (dates.includes(item)) {
      continue;
    }
    dates.push(item);
  }

  return uniqueSortedDates(dates);
}

export function serializeDiaryEntryEnvelope(treatmentId: string, entry: DiaryEntry): string {
  const envelope: DiaryEntryEnvelope = {
    version: DIARY_ENTRY_STORE_VERSION,
    treatmentId,
    entry: copyEntry(entry),
  };
  return JSON.stringify(envelope);
}

export function parseDiaryEntryEnvelope(
  raw: string | null,
  treatmentId: string,
): DiaryEntry | null {
  if (raw === null || raw === '') {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  if (parsed.version !== DIARY_ENTRY_STORE_VERSION) {
    return null;
  }

  if (parsed.treatmentId !== treatmentId) {
    return null;
  }

  return parseStoredEntry(parsed.entry, treatmentId);
}

function parseStoredEntry(value: unknown, treatmentId: string): DiaryEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.treatmentId !== treatmentId) {
    return null;
  }

  if (typeof value.patientId !== 'string' || value.patientId.length === 0) {
    return null;
  }

  if (!isRecord(value.submittedOn)) {
    return null;
  }

  try {
    return createDiaryEntry({
      treatmentId,
      patientId: value.patientId,
      submittedOn: {
        year: value.submittedOn.year as number,
        month: value.submittedOn.month as number,
        day: value.submittedOn.day as number,
      },
      answers: {
        pain: value.pain,
        swelling: value.swelling,
        wellbeing: value.wellbeing,
      },
    });
  } catch (error) {
    if (error instanceof InvalidDiaryEntryError) {
      return null;
    }
    return null;
  }
}

export function copyDiaryEntry(entry: DiaryEntry): DiaryEntry {
  return copyEntry(entry);
}

export function compareCivilDate(left: CalendarDate, right: CalendarDate): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}

function copyEntry(entry: DiaryEntry): DiaryEntry {
  return {
    id: entry.id,
    treatmentId: entry.treatmentId,
    patientId: entry.patientId,
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

function uniqueSortedDates(dates: readonly string[]): string[] {
  return [...new Set(dates)].sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
