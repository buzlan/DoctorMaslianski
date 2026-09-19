import type { FeedbackScore, FeedbackSurvey } from './types';

const ANSWER_KEYS = ['usefulnessScore', 'clarityScore'] as const;
const ANSWER_KEY_SET = new Set<string>(ANSWER_KEYS);

const ISO_8601_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export class InvalidFeedbackSurveyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFeedbackSurveyError';
  }
}

export type CreateFeedbackSurveyInput = {
  treatmentId: string;
  patientId: string;
  submittedAt: string;
  answers: unknown;
};

export function feedbackSurveyIdFor(treatmentId: string): string {
  return `${treatmentId}:feedback`;
}

export function createFeedbackSurvey(input: CreateFeedbackSurveyInput): FeedbackSurvey {
  if (typeof input.treatmentId !== 'string' || input.treatmentId.length === 0) {
    throw new InvalidFeedbackSurveyError('invalid field: treatmentId');
  }

  if (typeof input.patientId !== 'string' || input.patientId.length === 0) {
    throw new InvalidFeedbackSurveyError('invalid field: patientId');
  }

  if (typeof input.submittedAt !== 'string' || !ISO_8601_DATE_TIME.test(input.submittedAt)) {
    throw new InvalidFeedbackSurveyError('invalid field: submittedAt');
  }

  const answers = parseAnswers(input.answers);

  return {
    id: feedbackSurveyIdFor(input.treatmentId),
    treatmentId: input.treatmentId,
    patientId: input.patientId,
    submittedAt: input.submittedAt,
    usefulnessScore: answers.usefulnessScore,
    clarityScore: answers.clarityScore,
  };
}

function parseAnswers(answers: unknown): {
  usefulnessScore: FeedbackScore;
  clarityScore: FeedbackScore;
} {
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new InvalidFeedbackSurveyError('invalid answers');
  }

  for (const key of Reflect.ownKeys(answers)) {
    if (typeof key !== 'string' || !ANSWER_KEY_SET.has(key)) {
      throw new InvalidFeedbackSurveyError(
        typeof key === 'string' ? `unsupported answer field: ${key}` : 'unsupported answer field',
      );
    }
  }

  const record = answers as Record<string, unknown>;

  for (const required of ANSWER_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(answers, required)) {
      throw new InvalidFeedbackSurveyError(`missing answer field: ${required}`);
    }
  }

  return {
    usefulnessScore: parseScore(record.usefulnessScore, 'usefulnessScore'),
    clarityScore: parseScore(record.clarityScore, 'clarityScore'),
  };
}

function parseScore(value: unknown, field: 'usefulnessScore' | 'clarityScore'): FeedbackScore {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new InvalidFeedbackSurveyError(`invalid answer field: ${field}`);
  }

  return value as FeedbackScore;
}
