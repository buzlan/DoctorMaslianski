import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import type { DiaryEntry, VasScore, Wellbeing } from './types';

const ANSWER_KEYS = ['pain', 'swelling', 'wellbeing'] as const;
const ANSWER_KEY_SET = new Set<string>(ANSWER_KEYS);
const WELLBEING_VALUES = new Set<string>(['better', 'unchanged', 'worse']);

export class InvalidDiaryEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDiaryEntryError';
  }
}

export type CreateDiaryEntryInput = {
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  answers: unknown;
};

export function diaryEntryIdFor(treatmentId: string, onDate: CalendarDate): string {
  return `${treatmentId}:${onDate.year}-${onDate.month}-${onDate.day}`;
}

export function createDiaryEntry(input: CreateDiaryEntryInput): DiaryEntry {
  if (typeof input.treatmentId !== 'string' || input.treatmentId.length === 0) {
    throw new InvalidDiaryEntryError('invalid field: treatmentId');
  }

  if (typeof input.patientId !== 'string' || input.patientId.length === 0) {
    throw new InvalidDiaryEntryError('invalid field: patientId');
  }

  const submittedOn = calendarDate(
    input.submittedOn.year,
    input.submittedOn.month,
    input.submittedOn.day,
  );
  const answers = parseAnswers(input.answers);

  return {
    id: diaryEntryIdFor(input.treatmentId, submittedOn),
    treatmentId: input.treatmentId,
    patientId: input.patientId,
    submittedOn,
    pain: answers.pain,
    swelling: answers.swelling,
    wellbeing: answers.wellbeing,
  };
}

function parseAnswers(answers: unknown): {
  pain: VasScore;
  swelling: VasScore;
  wellbeing: Wellbeing;
} {
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new InvalidDiaryEntryError('invalid answers');
  }

  for (const key of Reflect.ownKeys(answers)) {
    if (typeof key !== 'string' || !ANSWER_KEY_SET.has(key)) {
      throw new InvalidDiaryEntryError(
        typeof key === 'string' ? `unsupported answer field: ${key}` : 'unsupported answer field',
      );
    }
  }

  const record = answers as Record<string, unknown>;

  for (const required of ANSWER_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(answers, required)) {
      throw new InvalidDiaryEntryError(`missing answer field: ${required}`);
    }
  }

  return {
    pain: parseVasScore(record.pain, 'pain'),
    swelling: parseVasScore(record.swelling, 'swelling'),
    wellbeing: parseWellbeing(record.wellbeing),
  };
}

function parseVasScore(value: unknown, field: 'pain' | 'swelling'): VasScore {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10) {
    throw new InvalidDiaryEntryError(`invalid answer field: ${field}`);
  }

  return value as VasScore;
}

function parseWellbeing(value: unknown): Wellbeing {
  if (typeof value !== 'string' || !WELLBEING_VALUES.has(value)) {
    throw new InvalidDiaryEntryError('invalid answer field: wellbeing');
  }

  return value as Wellbeing;
}
