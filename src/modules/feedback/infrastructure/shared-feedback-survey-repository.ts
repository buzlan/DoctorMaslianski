import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import { createAsyncStorageFeedbackSurveyStore } from './async-storage-feedback-survey-store';
import type { FeedbackSurveyRepository } from './feedback-survey-repository';
import { createPersistentFeedbackSurveyRepository } from './persistent-feedback-survey-repository';

const localFeedbackSurveyRepository = createPersistentFeedbackSurveyRepository({
  store: createAsyncStorageFeedbackSurveyStore(),
});

function activeFeedbackSurveyRepository(): FeedbackSurveyRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.feedback;
    }
  }

  return localFeedbackSurveyRepository;
}

export const sharedFeedbackSurveyRepository: FeedbackSurveyRepository = {
  getSurvey(treatmentId) {
    return activeFeedbackSurveyRepository().getSurvey(treatmentId);
  },
  submitSurvey(treatment, submittedAt, answers) {
    return activeFeedbackSurveyRepository().submitSurvey(
      treatment,
      submittedAt,
      answers,
    );
  },
};
