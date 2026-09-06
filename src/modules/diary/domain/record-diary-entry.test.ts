import { calendarDate, createTreatment, type TreatmentStatus } from '@/modules/treatment/domain';

import { createDiaryEntry, InvalidDiaryEntryError } from './create-diary-entry';
import { isDiaryOpenOnDate } from './helpers';
import { recordDiaryEntry } from './record-diary-entry';
import type { DiaryEntry } from './types';

const ON_DATE = calendarDate(2026, 8, 19);
const OTHER_DATE = calendarDate(2026, 8, 20);

function create(options: { status?: TreatmentStatus } = {}) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
    assignments: [],
  });
}

function answers(overrides: Record<string, unknown> = {}) {
  return { pain: 3, swelling: 4, wellbeing: 'unchanged', ...overrides };
}

describe('recordDiaryEntry', () => {
  it('records one entry keyed by treatment id and civil date', () => {
    const existingEntries: DiaryEntry[] = [];
    const result = recordDiaryEntry({
      treatment: create(),
      existingEntries,
      onDate: ON_DATE,
      answers: answers(),
    });

    expect(result.status).toBe('recorded');
    if (result.status !== 'recorded') {
      return;
    }

    expect(result.alreadyPresent).toBe(false);
    expect(result.entry).toEqual(
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: answers(),
      }),
    );
    expect(result.entries).toEqual([result.entry]);
    expect(existingEntries).toEqual([]);
    expect(isDiaryOpenOnDate(create(), result.entries, ON_DATE)).toBe(false);
  });

  it('is idempotent for the same civil date and keeps the original answers', () => {
    const first = recordDiaryEntry({
      treatment: create(),
      existingEntries: [],
      onDate: ON_DATE,
      answers: answers({ pain: 2 }),
    });
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }

    const second = recordDiaryEntry({
      treatment: create(),
      existingEntries: first.entries,
      onDate: ON_DATE,
      answers: answers({ pain: 9, swelling: 9, wellbeing: 'worse' }),
    });

    expect(second).toMatchObject({
      status: 'recorded',
      alreadyPresent: true,
      entry: first.entry,
    });
    if (second.status !== 'recorded') {
      return;
    }
    expect(second.entries).toBe(first.entries);
    expect(second.entries).toHaveLength(1);
    expect(second.entry.pain).toBe(2);
    expect(second.entry.wellbeing).toBe('unchanged');
  });

  it('does not re-validate new answers when the civil date is already complete', () => {
    const first = recordDiaryEntry({
      treatment: create(),
      existingEntries: [],
      onDate: ON_DATE,
      answers: answers(),
    });
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }

    expect(
      recordDiaryEntry({
        treatment: create(),
        existingEntries: first.entries,
        onDate: ON_DATE,
        answers: { pain: 99, heaviness: 1 },
      }),
    ).toMatchObject({
      status: 'recorded',
      alreadyPresent: true,
      entry: first.entry,
    });
  });

  it('appends a different civil date without rewriting earlier entries', () => {
    const first = recordDiaryEntry({
      treatment: create(),
      existingEntries: [],
      onDate: ON_DATE,
      answers: answers({ pain: 1 }),
    });
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }

    const second = recordDiaryEntry({
      treatment: create(),
      existingEntries: first.entries,
      onDate: OTHER_DATE,
      answers: answers({ pain: 5, wellbeing: 'better' }),
    });

    expect(second.status).toBe('recorded');
    if (second.status !== 'recorded') {
      return;
    }
    expect(second.alreadyPresent).toBe(false);
    expect(second.entries).toEqual([first.entry, second.entry]);
    expect(first.entries).toEqual([first.entry]);
    expect(second.entries[0]).toBe(first.entry);
  });

  it('ignores writes when the treatment is not active', () => {
    expect(
      recordDiaryEntry({
        treatment: create({ status: 'completed' }),
        existingEntries: [],
        onDate: ON_DATE,
        answers: answers(),
      }),
    ).toEqual({ status: 'ignored', reason: 'no_active_treatment' });

    expect(
      recordDiaryEntry({
        treatment: create({ status: 'cancelled' }),
        existingEntries: [],
        onDate: ON_DATE,
        answers: answers(),
      }),
    ).toEqual({ status: 'ignored', reason: 'no_active_treatment' });
  });

  it('is not gated by empty assignments or period range', () => {
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      periods: [],
      assignments: [],
    });

    const result = recordDiaryEntry({
      treatment,
      existingEntries: [],
      onDate: calendarDate(2026, 1, 1),
      answers: answers(),
    });

    expect(result.status).toBe('recorded');
    if (result.status !== 'recorded') {
      return;
    }
    expect(result.alreadyPresent).toBe(false);
    expect(result.entry.submittedOn).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it('still validates answers on the first insert', () => {
    expect(() =>
      recordDiaryEntry({
        treatment: create(),
        existingEntries: [],
        onDate: ON_DATE,
        answers: answers({ pain: 11 }),
      }),
    ).toThrow(InvalidDiaryEntryError);
  });
});
