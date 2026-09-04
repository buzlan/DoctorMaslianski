import { createAsyncStorageFeedbackSurveyStore } from './async-storage-feedback-survey-store';
import { createPersistentFeedbackSurveyRepository } from './persistent-feedback-survey-repository';

export const sharedFeedbackSurveyRepository = createPersistentFeedbackSurveyRepository({
  store: createAsyncStorageFeedbackSurveyStore(),
});
