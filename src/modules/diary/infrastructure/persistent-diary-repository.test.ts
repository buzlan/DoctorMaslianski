import { calendarDate, createTreatment } from '@/modules/treatment/domain';

import { diaryEntryIdFor } from '../domain';

import { createInMemoryDiaryEntryStore } from './in-memory-diary-entry-store';
import { createPersistentDiaryRepository } from './persistent-diary-repository';

const ON_DATE = calendarDate(2026, 8, 19);
const NEXT_DATE = calendarDate(2026, 8, 20);
const TREATMENT_ID = 'treatment-1';

function treatment() {
  return createTreatment({
    id: TREATMENT_ID,
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function answers(pain = 3) {
  return { pain, swelling: 4, wellbeing: 'unchanged' as const };
}

describe('createPersistentDiaryRepository', () => {
  it('reloads submitted entries into a new repository instance from the same store', async () => {
    const store = createInMemoryDiaryEntryStore();
    const repository = createPersistentDiaryRepository({ store });

    const result = await repository.submitEntry(treatment(), ON_DATE, answers(2));

    expect(result).toMatchObject({
      status: 'recorded',
      alreadyPresent: false,
      entry: {
        id: diaryEntryIdFor(TREATMENT_ID, ON_DATE),
        pain: 2,
        swelling: 4,
        wellbeing: 'unchanged',
      },
    });

    const restarted = createPersistentDiaryRepository({ store });
    expect(await restarted.getEntryOnDate(TREATMENT_ID, ON_DATE)).toEqual(
      result.status === 'recorded' ? result.entry : null,
    );
    expect(await restarted.listEntries(TREATMENT_ID)).toHaveLength(1);
    expect(store.getIndexRaw(TREATMENT_ID)).not.toContain('pain');
    expect(store.getIndexRaw(TREATMENT_ID)).not.toContain('unchanged');
  });

  it('treats a second submit for the same civil date as already complete', async () => {
    const store = createInMemoryDiaryEntryStore();
    const repository = createPersistentDiaryRepository({ store });

    const first = await repository.submitEntry(treatment(), ON_DATE, answers(2));
    const second = await repository.submitEntry(treatment(), ON_DATE, {
      pain: 9,
      swelling: 9,
      wellbeing: 'worse',
    });

    expect(first.status).toBe('recorded');
    expect(second).toMatchObject({ status: 'recorded', alreadyPresent: true });
    if (first.status !== 'recorded' || second.status !== 'recorded') {
      return;
    }
    expect(second.entry).toEqual(first.entry);
    expect((await repository.getEntryOnDate(TREATMENT_ID, ON_DATE))?.pain).toBe(2);
  });

  it('records a new civil date without changing the previous entry', async () => {
    const store = createInMemoryDiaryEntryStore();
    const repository = createPersistentDiaryRepository({ store });

    await repository.submitEntry(treatment(), ON_DATE, answers(2));
    await repository.submitEntry(treatment(), NEXT_DATE, answers(5));

    const restarted = createPersistentDiaryRepository({ store });
    expect((await restarted.getEntryOnDate(TREATMENT_ID, ON_DATE))?.pain).toBe(2);
    expect((await restarted.getEntryOnDate(TREATMENT_ID, NEXT_DATE))?.pain).toBe(5);
    expect(await restarted.listEntries(TREATMENT_ID)).toHaveLength(2);
  });

  it('does not keep a new entry when store save fails', async () => {
    let failSave = true;
    const store = createInMemoryDiaryEntryStore({
      onSave: () => {
        if (failSave) {
          throw new Error('save failed');
        }
      },
    });
    const repository = createPersistentDiaryRepository({ store });

    await expect(repository.submitEntry(treatment(), ON_DATE, answers(2))).rejects.toThrow(
      'save failed',
    );
    expect(await repository.getEntryOnDate(TREATMENT_ID, ON_DATE)).toBeNull();

    failSave = false;
    const result = await repository.submitEntry(treatment(), ON_DATE, answers(2));
    expect(result).toMatchObject({ status: 'recorded', alreadyPresent: false });
  });

  it('ignores submit when treatment is not active', async () => {
    const repository = createPersistentDiaryRepository({
      store: createInMemoryDiaryEntryStore(),
    });
    const completed = createTreatment({
      id: TREATMENT_ID,
      patientId: 'patient-1',
      status: 'completed',
      periods: [{ id: 'period-1', startedOn: ON_DATE }],
    });

    await expect(repository.submitEntry(completed, ON_DATE, answers())).resolves.toEqual({
      status: 'ignored',
      reason: 'no_active_treatment',
    });
  });
});
