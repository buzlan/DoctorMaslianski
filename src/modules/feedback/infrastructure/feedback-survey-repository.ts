import type { Treatment } from '@/modules/treatment/domain';

import type { FeedbackSurvey, RecordFeedbackSurveyResult } from '../domain';

export type FeedbackSurveyRepository = {
  getSurvey(treatmentId: string): Promise<FeedbackSurvey | null>;
  submitSurvey(
    treatment: Treatment,
    submittedAt: string,
    answers: unknown,
  ): Promise<RecordFeedbackSurveyResult>;
};
