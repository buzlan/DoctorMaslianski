/**
 * In-memory DiaryRepository.
 *
 * Entries are lost when the process exits. Local-at-rest persistence for diary
 * answers is a separate decision (TASK-012) and must not reuse the assignment
 * completion overlay.
 *
 * listEntries returns oldest-first civil-date order so tests are stable. That
 * is not the Diary-history UI contract; TASK-013 may present newest-first or
 * another explicit order.
 */

import {
  isSameCalendarDate,
  type CalendarDate,
  type Treatment,
} from '@/modules/treatment/domain';

import { recordDiaryEntry, type DiaryEntry } from '../domain';

import type { DiaryRepository, SubmitDiaryEntryResult } from './diary-repository';

function compareCivilDate(left: CalendarDate, right: CalendarDate): number {
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

class InMemoryDiaryRepository implements DiaryRepository {
  private readonly byTreatment = new Map<string, DiaryEntry[]>();

  listEntries(treatmentId: string): Promise<readonly DiaryEntry[]> {
    const stored = this.byTreatment.get(treatmentId) ?? [];
    const listed = stored.map(copyEntry).sort((left, right) =>
      compareCivilDate(left.submittedOn, right.submittedOn),
    );
    return Promise.resolve(listed);
  }

  getEntryOnDate(
    treatmentId: string,
    onDate: CalendarDate,
  ): Promise<DiaryEntry | null> {
    const entries = this.byTreatment.get(treatmentId) ?? [];
    const match = entries.find((entry) => isSameCalendarDate(entry.submittedOn, onDate));
    return Promise.resolve(match === undefined ? null : copyEntry(match));
  }

  submitEntry(
    treatment: Treatment,
    onDate: CalendarDate,
    answers: { pain: number; swelling: number; wellbeing: string },
  ): Promise<SubmitDiaryEntryResult> {
    const existingEntries = this.byTreatment.get(treatment.id) ?? [];
    const result = recordDiaryEntry({
      treatment,
      existingEntries,
      onDate,
      answers,
    });

    if (result.status === 'ignored') {
      return Promise.resolve(result);
    }

    if (!result.alreadyPresent) {
      this.byTreatment.set(treatment.id, result.entries.map(copyEntry));
    }

    return Promise.resolve({
      status: 'recorded',
      entry: copyEntry(result.entry),
      alreadyPresent: result.alreadyPresent,
    });
  }
}

export function createInMemoryDiaryRepository(): DiaryRepository {
  return new InMemoryDiaryRepository();
}
