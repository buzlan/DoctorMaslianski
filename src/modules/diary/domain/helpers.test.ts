import { calendarDate, createTreatment } from '@/modules/treatment/domain';

import { createDiaryEntry } from './create-diary-entry';
import { getDiaryEntryOnDate, hasDiaryEntryOnDate, isDiaryOpenOnDate } from './helpers';

const ON_DATE = calendarDate(2026, 8, 19);
const NEXT_DATE = calendarDate(2026, 8, 20);

function treatment(status: 'active' | 'completed' | 'cancelled' = 'active') {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status,
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function entryOn(onDate: typeof ON_DATE) {
  return createDiaryEntry({
    treatmentId: 'treatment-1',
    patientId: 'patient-1',
    submittedOn: onDate,
    answers: { pain: 2, swelling: 1, wellbeing: 'better' },
  });
}

describe('hasDiaryEntryOnDate', () => {
  it('is true only for a matching civil date', () => {
    const entries = [entryOn(ON_DATE)];

    expect(hasDiaryEntryOnDate(entries, ON_DATE)).toBe(true);
    expect(hasDiaryEntryOnDate(entries, NEXT_DATE)).toBe(false);
    expect(getDiaryEntryOnDate(entries, ON_DATE)?.id).toBe(entries[0]?.id);
    expect(getDiaryEntryOnDate(entries, NEXT_DATE)).toBeUndefined();
  });
});

describe('isDiaryOpenOnDate', () => {
  it('is true for an active treatment with no entry on that civil date', () => {
    expect(isDiaryOpenOnDate(treatment(), [], ON_DATE)).toBe(true);
  });

  it('is false after an entry is recorded for that civil date', () => {
    expect(isDiaryOpenOnDate(treatment(), [entryOn(ON_DATE)], ON_DATE)).toBe(false);
  });

  it('is true again on the next civil date', () => {
    expect(isDiaryOpenOnDate(treatment(), [entryOn(ON_DATE)], NEXT_DATE)).toBe(true);
  });

  it('is false when treatment is not active even if no entry exists', () => {
    expect(isDiaryOpenOnDate(treatment('completed'), [], ON_DATE)).toBe(false);
    expect(isDiaryOpenOnDate(treatment('cancelled'), [], ON_DATE)).toBe(false);
  });
});
