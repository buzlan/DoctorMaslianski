import type { Treatment } from '@/modules/treatment/domain';

import {
  copyFeedbackSurvey,
  recordFeedbackSurvey,
  type FeedbackSurvey,
  type RecordFeedbackSurveyResult,
} from '../domain';

import type { FeedbackSurveyRepository } from './feedback-survey-repository';

class InMemoryFeedbackSurveyRepository implements FeedbackSurveyRepository {
  private readonly byTreatment = new Map<string, FeedbackSurvey>();

  getSurvey(treatmentId: string): Promise<FeedbackSurvey | null> {
    const stored = this.byTreatment.get(treatmentId);
    return Promise.resolve(stored === undefined ? null : copyFeedbackSurvey(stored));
  }

  submitSurvey(
    treatment: Treatment,
    submittedAt: string,
    answers: unknown,
  ): Promise<RecordFeedbackSurveyResult> {
    const existing = this.byTreatment.get(treatment.id) ?? null;
    const result = recordFeedbackSurvey({
      treatment,
      existing,
      submittedAt,
      answers,
    });

    if (result.status === 'recorded' && !result.alreadyPresent) {
      this.byTreatment.set(treatment.id, copyFeedbackSurvey(result.survey));
    }

    return Promise.resolve(result);
  }
}

export function createInMemoryFeedbackSurveyRepository(): FeedbackSurveyRepository {
  return new InMemoryFeedbackSurveyRepository();
}
