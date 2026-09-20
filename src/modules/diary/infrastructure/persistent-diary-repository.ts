/**
 * DiaryRepository that hydrates from DiaryEntryStore.
 *
 * Domain writes still go through recordDiaryEntry. Persistence is a separate
 * local-at-rest adapter and must not reuse the assignment completion overlay.
 */

import {
  isSameCalendarDate,
  type CalendarDate,
  type Treatment,
} from '@/modules/treatment/domain';

import { recordDiaryEntry, type DiaryEntry } from '../domain';

import {
  compareCivilDate,
  copyDiaryEntry,
  type DiaryEntryStore,
} from './diary-entry-store';
import type { DiaryRepository, SubmitDiaryEntryResult } from './diary-repository';

export type PersistentDiaryRepositoryOptions = {
  store: DiaryEntryStore;
};

class PersistentDiaryRepository implements DiaryRepository {
  private readonly store: DiaryEntryStore;
  private readonly byTreatment = new Map<string, DiaryEntry[]>();
  private readonly hydrated = new Set<string>();
  private queue: Promise<void> = Promise.resolve();

  constructor(store: DiaryEntryStore) {
    this.store = store;
  }

  listEntries(treatmentId: string): Promise<readonly DiaryEntry[]> {
    return this.enqueue(async () => {
      await this.hydrate(treatmentId);
      return this.listed(treatmentId);
    });
  }

  getEntryOnDate(treatmentId: string, onDate: CalendarDate): Promise<DiaryEntry | null> {
    return this.enqueue(async () => {
      await this.hydrate(treatmentId);
      const match = (this.byTreatment.get(treatmentId) ?? []).find((entry) =>
        isSameCalendarDate(entry.submittedOn, onDate),
      );
      return match === undefined ? null : copyDiaryEntry(match);
    });
  }

  submitEntry(
    treatment: Treatment,
    onDate: CalendarDate,
    answers: { pain: number; swelling: number; wellbeing: string },
  ): Promise<SubmitDiaryEntryResult> {
    return this.enqueue(async () => {
      await this.hydrate(treatment.id);

      const existingEntries = this.byTreatment.get(treatment.id) ?? [];
      const result = recordDiaryEntry({
        treatment,
        existingEntries,
        onDate,
        answers,
      });

      if (result.status === 'ignored') {
        return result;
      }

      if (!result.alreadyPresent) {
        await this.store.save(treatment.id, result.entries);
        this.byTreatment.set(treatment.id, result.entries.map(copyDiaryEntry));
      }

      return {
        status: 'recorded',
        entry: copyDiaryEntry(result.entry),
        alreadyPresent: result.alreadyPresent,
      };
    });
  }

  private listed(treatmentId: string): readonly DiaryEntry[] {
    return (this.byTreatment.get(treatmentId) ?? [])
      .map(copyDiaryEntry)
      .sort((left, right) => compareCivilDate(left.submittedOn, right.submittedOn));
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async hydrate(treatmentId: string): Promise<void> {
    if (this.hydrated.has(treatmentId)) {
      return;
    }

    let stored: readonly DiaryEntry[] = [];
    try {
      stored = await this.store.load(treatmentId);
    } catch {
      stored = [];
    }

    this.byTreatment.set(treatmentId, stored.map(copyDiaryEntry));
    this.hydrated.add(treatmentId);
  }
}

export function createPersistentDiaryRepository(
  options: PersistentDiaryRepositoryOptions,
): DiaryRepository {
  return new PersistentDiaryRepository(options.store);
}
