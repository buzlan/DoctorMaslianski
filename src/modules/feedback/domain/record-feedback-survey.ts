import type { Treatment } from '@/modules/treatment/domain';

import { createFeedbackSurvey } from './create-feedback-survey';
import type { FeedbackSurvey } from './types';

export type RecordFeedbackSurveyResult =
  | {
      status: 'recorded';
      survey: FeedbackSurvey;
      alreadyPresent: boolean;
    }
  | {
      status: 'ignored';
      reason: 'treatment_not_completed';
    };

export function recordFeedbackSurvey(input: {
  treatment: Treatment;
  existing: FeedbackSurvey | null;
  submittedAt: string;
  answers: unknown;
}): RecordFeedbackSurveyResult {
  if (input.treatment.status !== 'completed') {
    return { status: 'ignored', reason: 'treatment_not_completed' };
  }

  if (input.existing !== null) {
    return {
      status: 'recorded',
      survey: copySurvey(input.existing),
      alreadyPresent: true,
    };
  }

  return {
    status: 'recorded',
    survey: createFeedbackSurvey({
      treatmentId: input.treatment.id,
      patientId: input.treatment.patientId,
      submittedAt: input.submittedAt,
      answers: input.answers,
    }),
    alreadyPresent: false,
  };
}

export function copyFeedbackSurvey(survey: FeedbackSurvey): FeedbackSurvey {
  return copySurvey(survey);
}

function copySurvey(survey: FeedbackSurvey): FeedbackSurvey {
  return {
    id: survey.id,
    treatmentId: survey.treatmentId,
    patientId: survey.patientId,
    submittedAt: survey.submittedAt,
    usefulnessScore: survey.usefulnessScore,
    clarityScore: survey.clarityScore,
  };
}
