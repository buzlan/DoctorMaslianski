/**
 * Temporary TASK-012 SecureStore adapter for development / internal dry-run
 * restart survival.
 *
 * Layout:
 * - one DiaryEntry per key (`diary.v1.entry.{treatmentId}.{YYYYMMDD}`)
 * - one compact per-treatment date index (`diary.v1.index.{treatmentId}`)
 *
 * Not an ever-growing JSON array of all entries. Not the final real-patient
 * clinical store. DiaryEntryStore / DiaryRepository stay replaceable.
 *
 * Device Keychain/Keystore encryption is not clinic-controlled encryption.
 * iOS Keychain may persist across uninstall with the same bundle id.
 */

import * as SecureStore from 'expo-secure-store';

import type { DiaryEntry } from '../domain';

import {
  compareCivilDate,
  compactCivilDate,
  copyDiaryEntry,
  diaryEntryStorageKey,
  diaryIndexStorageKey,
  parseCompactCivilDate,
  parseDiaryEntryEnvelope,
  parseDiaryIndex,
  serializeDiaryEntryEnvelope,
  serializeDiaryIndex,
  type DiaryEntryStore,
} from './diary-entry-store';

export type SecureStoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export function createSecureStoreDiaryEntryStore(
  secureStore: SecureStoreLike = SecureStore,
): DiaryEntryStore {
  return {
    async load(treatmentId: string): Promise<readonly DiaryEntry[]> {
      let indexRaw: string | null;
      try {
        indexRaw = await secureStore.getItemAsync(diaryIndexStorageKey(treatmentId));
      } catch {
        return [];
      }

      const dates = parseDiaryIndex(indexRaw, treatmentId);
      const entries: DiaryEntry[] = [];

      for (const compactDate of dates) {
        const onDate = parseCompactCivilDate(compactDate);
        if (onDate === null) {
          continue;
        }

        let entryRaw: string | null;
        try {
          entryRaw = await secureStore.getItemAsync(diaryEntryStorageKey(treatmentId, onDate));
        } catch {
          continue;
        }

        const entry = parseDiaryEntryEnvelope(entryRaw, treatmentId);
        if (entry === null) {
          continue;
        }

        entries.push(copyDiaryEntry(entry));
      }

      return entries.sort((left, right) => compareCivilDate(left.submittedOn, right.submittedOn));
    },

    async save(treatmentId: string, entries: readonly DiaryEntry[]): Promise<void> {
      let previousIndexRaw: string | null = null;
      try {
        previousIndexRaw = await secureStore.getItemAsync(diaryIndexStorageKey(treatmentId));
      } catch {
        previousIndexRaw = null;
      }

      const previousDates = parseDiaryIndex(previousIndexRaw, treatmentId);
      const nextDates = new Set(entries.map((entry) => compactCivilDate(entry.submittedOn)));

      for (const entry of entries) {
        await secureStore.setItemAsync(
          diaryEntryStorageKey(treatmentId, entry.submittedOn),
          serializeDiaryEntryEnvelope(treatmentId, entry),
        );
      }

      await secureStore.setItemAsync(
        diaryIndexStorageKey(treatmentId),
        serializeDiaryIndex(treatmentId, entries),
      );

      for (const compactDate of previousDates) {
        if (nextDates.has(compactDate)) {
          continue;
        }

        const onDate = parseCompactCivilDate(compactDate);
        if (onDate === null) {
          continue;
        }

        try {
          await secureStore.deleteItemAsync(diaryEntryStorageKey(treatmentId, onDate));
        } catch {
          // Dropping a stale key is best-effort.
        }
      }
    },
  };
}
