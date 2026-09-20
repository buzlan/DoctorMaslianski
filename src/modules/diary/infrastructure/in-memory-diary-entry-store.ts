import type { DiaryEntry } from '../domain';

import {
  compareCivilDate,
  copyDiaryEntry,
  serializeDiaryIndex,
  type DiaryEntryStore,
} from './diary-entry-store';

export type InMemoryDiaryEntryStore = DiaryEntryStore & {
  getIndexRaw(treatmentId: string): string | undefined;
};

export function createInMemoryDiaryEntryStore(options?: {
  onSave?: (treatmentId: string, entries: readonly DiaryEntry[]) => Promise<void> | void;
}): InMemoryDiaryEntryStore {
  const byTreatment = new Map<string, DiaryEntry[]>();
  const indexRaw = new Map<string, string>();

  return {
    getIndexRaw(treatmentId) {
      return indexRaw.get(treatmentId);
    },
    async load(treatmentId) {
      return (byTreatment.get(treatmentId) ?? [])
        .map(copyDiaryEntry)
        .sort((left, right) => compareCivilDate(left.submittedOn, right.submittedOn));
    },
    async save(treatmentId, entries) {
      await options?.onSave?.(treatmentId, entries);
      const copied = entries.map(copyDiaryEntry);
      byTreatment.set(treatmentId, copied);
      indexRaw.set(treatmentId, serializeDiaryIndex(treatmentId, copied));
    },
  };
}
