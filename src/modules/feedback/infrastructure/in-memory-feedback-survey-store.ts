import { copyFeedbackSurvey, type FeedbackSurvey } from '../domain';

import {
  serializeFeedbackSurvey,
  type FeedbackSurveyStore,
} from './feedback-survey-store';

export type InMemoryFeedbackSurveyStore = FeedbackSurveyStore & {
  getRaw(treatmentId: string): string | undefined;
};

export function createInMemoryFeedbackSurveyStore(): InMemoryFeedbackSurveyStore {
  const byTreatment = new Map<string, FeedbackSurvey>();
  const rawByTreatment = new Map<string, string>();

  return {
    getRaw(treatmentId) {
      return rawByTreatment.get(treatmentId);
    },
    async load(treatmentId) {
      const stored = byTreatment.get(treatmentId);
      return stored === undefined ? null : copyFeedbackSurvey(stored);
    },
    async save(treatmentId, survey) {
      const copied = copyFeedbackSurvey(survey);
      byTreatment.set(treatmentId, copied);
      rawByTreatment.set(treatmentId, serializeFeedbackSurvey(treatmentId, copied));
    },
  };
}
