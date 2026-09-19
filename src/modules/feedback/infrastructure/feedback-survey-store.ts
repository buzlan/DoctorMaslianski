import {
  copyFeedbackSurvey,
  createFeedbackSurvey,
  InvalidFeedbackSurveyError,
  type FeedbackSurvey,
} from '../domain';

/**
 * Local-at-rest boundary for one FeedbackSurvey per treatment.
 *
 * Product validation only. Do not reuse the assignment-completion overlay
 * or the diary store. Remote flush is TASK-031.
 */
export type FeedbackSurveyStore = {
  load(treatmentId: string): Promise<FeedbackSurvey | null>;
  save(treatmentId: string, survey: FeedbackSurvey): Promise<void>;
};

export const FEEDBACK_SURVEY_STORE_VERSION = 1;

export type FeedbackSurveyEnvelope = {
  version: typeof FEEDBACK_SURVEY_STORE_VERSION;
  treatmentId: string;
  survey: FeedbackSurvey;
};

const STORAGE_KEY_SAFE = /[^A-Za-z0-9._-]/g;

export function sanitizeStorageKeyPart(value: string): string {
  return value.replace(STORAGE_KEY_SAFE, '_');
}

export function feedbackSurveyStorageKey(treatmentId: string): string {
  return `feedback.survey.v1.${sanitizeStorageKeyPart(treatmentId)}`;
}

export function serializeFeedbackSurvey(
  treatmentId: string,
  survey: FeedbackSurvey,
): string {
  const envelope: FeedbackSurveyEnvelope = {
    version: FEEDBACK_SURVEY_STORE_VERSION,
    treatmentId,
    survey: copyFeedbackSurvey(survey),
  };
  return JSON.stringify(envelope);
}

export function parseFeedbackSurvey(
  raw: string | null,
  treatmentId: string,
): FeedbackSurvey | null {
  if (raw === null || raw === '') {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  if (parsed.version !== FEEDBACK_SURVEY_STORE_VERSION) {
    return null;
  }

  if (parsed.treatmentId !== treatmentId) {
    return null;
  }

  if (!isRecord(parsed.survey)) {
    return null;
  }

  const survey = parsed.survey;
  if (typeof survey.id !== 'string' || survey.id.length === 0) {
    return null;
  }
  if (survey.treatmentId !== treatmentId) {
    return null;
  }
  if (typeof survey.patientId !== 'string' || survey.patientId.length === 0) {
    return null;
  }
  if (typeof survey.submittedAt !== 'string') {
    return null;
  }
  if (typeof survey.usefulnessScore !== 'number' || typeof survey.clarityScore !== 'number') {
    return null;
  }

  try {
    return createFeedbackSurvey({
      treatmentId,
      patientId: survey.patientId,
      submittedAt: survey.submittedAt,
      answers: {
        usefulnessScore: survey.usefulnessScore,
        clarityScore: survey.clarityScore,
      },
    });
  } catch (error) {
    if (error instanceof InvalidFeedbackSurveyError) {
      return null;
    }
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
