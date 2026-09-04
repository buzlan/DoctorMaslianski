import { calendarDate, createTreatment } from '@/modules/treatment/domain';

import { diaryEntryIdFor } from '../domain';

import { createInMemoryDiaryRepository } from './in-memory-diary-repository';

const ON_DATE = calendarDate(2026, 8, 19);
const EARLIER_DATE = calendarDate(2026, 8, 18);
const LATER_DATE = calendarDate(2026, 8, 20);

function treatment(id = 'treatment-1') {
  return createTreatment({
    id,
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function answers(pain = 3) {
  return { pain, swelling: 4, wellbeing: 'unchanged' as const };
}

describe('createInMemoryDiaryRepository', () => {
  it('returns an empty list when no entries have been submitted', async () => {
    const repository = createInMemoryDiaryRepository();

    expect(await repository.listEntries('treatment-1')).toEqual([]);
    expect(await repository.getEntryOnDate('treatment-1', ON_DATE)).toBeNull();
  });

  it('submits, reads by civil date, and lists the recorded entry', async () => {
    const repository = createInMemoryDiaryRepository();
    const result = await repository.submitEntry(treatment(), ON_DATE, answers(2));

    expect(result).toMatchObject({
      status: 'recorded',
      alreadyPresent: false,
      entry: {
        id: diaryEntryIdFor('treatment-1', ON_DATE),
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        pain: 2,
        swelling: 4,
        wellbeing: 'unchanged',
      },
    });

    expect(await repository.getEntryOnDate('treatment-1', ON_DATE)).toEqual(
      result.status === 'recorded' ? result.entry : null,
    );
    expect(await repository.listEntries('treatment-1')).toEqual([
      result.status === 'recorded' ? result.entry : undefined,
    ]);
  });

  it('treats a second submit for the same civil date as already complete', async () => {
    const repository = createInMemoryDiaryRepository();
    const first = await repository.submitEntry(treatment(), ON_DATE, answers(2));
    const second = await repository.submitEntry(treatment(), ON_DATE, {
      pain: 9,
      swelling: 9,
      wellbeing: 'worse',
    });

    expect(first.status).toBe('recorded');
    expect(second).toMatchObject({
      status: 'recorded',
      alreadyPresent: true,
    });
    if (first.status !== 'recorded' || second.status !== 'recorded') {
      return;
    }
    expect(second.entry).toEqual(first.entry);
    expect(await repository.listEntries('treatment-1')).toHaveLength(1);
    expect((await repository.getEntryOnDate('treatment-1', ON_DATE))?.pain).toBe(2);
  });

  it('lists stored rows in deterministic oldest-first civil-date order', async () => {
    // Deterministic for tests only. TASK-013 may present newest-first or another order.
    const repository = createInMemoryDiaryRepository();
    const assigned = treatment();

    await repository.submitEntry(assigned, LATER_DATE, answers(5));
    await repository.submitEntry(assigned, EARLIER_DATE, answers(1));
    await repository.submitEntry(assigned, ON_DATE, answers(3));

    const listed = await repository.listEntries('treatment-1');

    expect(listed.map((entry) => entry.submittedOn)).toEqual([
      EARLIER_DATE,
      ON_DATE,
      LATER_DATE,
    ]);
  });

  it('isolates entries by treatment id', async () => {
    const repository = createInMemoryDiaryRepository();

    await repository.submitEntry(treatment('treatment-a'), ON_DATE, answers(1));
    await repository.submitEntry(treatment('treatment-b'), ON_DATE, answers(8));

    const first = await repository.listEntries('treatment-a');
    const second = await repository.listEntries('treatment-b');

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0]?.pain).toBe(1);
    expect(second[0]?.pain).toBe(8);
    expect(first[0]?.treatmentId).toBe('treatment-a');
    expect(second[0]?.treatmentId).toBe('treatment-b');
  });

  it('ignores submit when treatment is not active', async () => {
    const repository = createInMemoryDiaryRepository();
    const completed = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      status: 'completed',
    });

    const result = await repository.submitEntry(completed, ON_DATE, answers());

    expect(result).toEqual({ status: 'ignored', reason: 'no_active_treatment' });
    expect(await repository.listEntries('treatment-1')).toEqual([]);
  });

  it('does not rewrite stored rows when a returned date is mutated', async () => {
    const repository = createInMemoryDiaryRepository();
    await repository.submitEntry(treatment(), ON_DATE, answers(2));

    const listed = await repository.listEntries('treatment-1');
    const first = listed[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    first.submittedOn.day = 1;

    const reread = await repository.listEntries('treatment-1');
    expect(reread).toHaveLength(1);
    expect(reread[0]?.submittedOn).toEqual(ON_DATE);
    expect(reread[0]?.pain).toBe(2);
  });
});
