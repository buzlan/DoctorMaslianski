/**
 * AsyncStorage adapter for TASK-028 FeedbackSurvey.
 *
 * Product validation only (usefulness and clarity scores). Do not reuse the
 * assignment-completion overlay or the diary store. Remote flush is TASK-031.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FeedbackSurvey } from '../domain';

import {
  feedbackSurveyStorageKey,
  parseFeedbackSurvey,
  serializeFeedbackSurvey,
  type FeedbackSurveyStore,
} from './feedback-survey-store';

export function createAsyncStorageFeedbackSurveyStore(): FeedbackSurveyStore {
  return {
    async load(treatmentId: string): Promise<FeedbackSurvey | null> {
      try {
        const raw = await AsyncStorage.getItem(feedbackSurveyStorageKey(treatmentId));
        return parseFeedbackSurvey(raw, treatmentId);
      } catch {
        return null;
      }
    },
    async save(treatmentId: string, survey: FeedbackSurvey): Promise<void> {
      await AsyncStorage.setItem(
        feedbackSurveyStorageKey(treatmentId),
        serializeFeedbackSurvey(treatmentId, survey),
      );
    },
  };
}
