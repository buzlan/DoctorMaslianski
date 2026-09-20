import { calendarDate } from '@/modules/treatment/domain';

import {
  createDiaryEntry,
  diaryEntryIdFor,
  InvalidDiaryEntryError,
} from './create-diary-entry';

const ON_DATE = calendarDate(2026, 8, 19);

function validAnswers() {
  return { pain: 3, swelling: 4, wellbeing: 'unchanged' as const };
}

describe('createDiaryEntry', () => {
  it('creates a validated entry against the confirmed field set', () => {
    const entry = createDiaryEntry({
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      answers: validAnswers(),
    });

    expect(entry).toEqual({
      id: diaryEntryIdFor('treatment-1', ON_DATE),
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      pain: 3,
      swelling: 4,
      wellbeing: 'unchanged',
    });
    expect(entry).not.toHaveProperty('heaviness');
    expect(entry).not.toHaveProperty('notes');
    expect(entry).not.toHaveProperty('submittedAt');
  });

  it('accepts VAS 0 and 10 and each wellbeing value', () => {
    expect(
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 0, swelling: 10, wellbeing: 'better' },
      }),
    ).toMatchObject({ pain: 0, swelling: 10, wellbeing: 'better' });

    expect(
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 10, swelling: 0, wellbeing: 'worse' },
      }),
    ).toMatchObject({ pain: 10, swelling: 0, wellbeing: 'worse' });
  });

  it('copies submittedOn so later mutation of the input date is not rewritten', () => {
    const submittedOn = calendarDate(2026, 8, 19);
    const entry = createDiaryEntry({
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn,
      answers: validAnswers(),
    });

    submittedOn.day = 1;

    expect(entry.submittedOn).toEqual({ year: 2026, month: 8, day: 19 });
    expect(entry.submittedOn).not.toBe(submittedOn);
  });

  it.each([
    ['pain', -1],
    ['pain', 11],
    ['pain', 1.5],
    ['pain', Number.NaN],
    ['pain', Number.POSITIVE_INFINITY],
    ['swelling', -1],
    ['swelling', 11],
    ['swelling', 1.5],
  ])('rejects non-integer or out-of-range VAS on %s', (field, value) => {
    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { ...validAnswers(), [field]: value },
      }),
    ).toThrow(new InvalidDiaryEntryError(`invalid answer field: ${field}`));
  });

  it('does not apply VAS to wellbeing', () => {
    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 3, swelling: 4, wellbeing: 5 },
      }),
    ).toThrow(new InvalidDiaryEntryError('invalid answer field: wellbeing'));
  });

  it('rejects a VAS field that uses a wellbeing string', () => {
    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 'better', swelling: 4, wellbeing: 'unchanged' },
      }),
    ).toThrow(new InvalidDiaryEntryError('invalid answer field: pain'));
  });

  it.each(['pain', 'swelling', 'wellbeing'])('rejects a missing %s field', (field) => {
    const answers: Record<string, unknown> = validAnswers();
    delete answers[field];

    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers,
      }),
    ).toThrow(new InvalidDiaryEntryError(`missing answer field: ${field}`));
  });

  it.each([
    'heaviness',
    'itching',
    'burning',
    'vsPreviousDay',
    'notes',
    'risk',
  ])('rejects unknown answer key %s', (field) => {
    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { ...validAnswers(), [field]: 1 },
      }),
    ).toThrow(new InvalidDiaryEntryError(`unsupported answer field: ${field}`));
  });

  it('rejects extra keys on JSON.parse output', () => {
    const answers = JSON.parse(
      '{"pain":3,"swelling":4,"wellbeing":"unchanged","heaviness":2}',
    ) as unknown;

    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers,
      }),
    ).toThrow(new InvalidDiaryEntryError('unsupported answer field: heaviness'));
  });

  it('rejects extra keys on a loosely typed answers object', () => {
    const answers: unknown = {
      pain: 3,
      swelling: 4,
      wellbeing: 'unchanged',
      note: 'worse than yesterday',
    };

    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers,
      }),
    ).toThrow(new InvalidDiaryEntryError('unsupported answer field: note'));
  });

  it('rejects symbol keys on the answers object', () => {
    const answers = {
      pain: 3,
      swelling: 4,
      wellbeing: 'unchanged',
      [Symbol('extra')]: 1,
    };

    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers,
      }),
    ).toThrow(new InvalidDiaryEntryError('unsupported answer field'));
  });

  it('rejects null, array, and non-object answers', () => {
    const invalidAnswers = [null, [3, 4, 'unchanged'], 3, 'unchanged'];

    for (const answers of invalidAnswers) {
      expect(() =>
        createDiaryEntry({
          treatmentId: 'treatment-1',
          patientId: 'patient-1',
          submittedOn: ON_DATE,
          answers,
        }),
      ).toThrow(new InvalidDiaryEntryError('invalid answers'));
    }
  });

  it('does not include rejected answer values in the error message', () => {
    expect(() =>
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 99, swelling: 4, wellbeing: 'unchanged' },
      }),
    ).toThrow('invalid answer field: pain');

    try {
      createDiaryEntry({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        answers: { pain: 99, swelling: 4, wellbeing: 'unchanged' },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDiaryEntryError);
      expect(String(error)).not.toContain('99');
    }
  });
});
