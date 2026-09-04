import type { Treatment } from '@/modules/treatment/domain';

import {
  copyFeedbackSurvey,
  recordFeedbackSurvey,
  type FeedbackSurvey,
  type RecordFeedbackSurveyResult,
} from '../domain';

import type { FeedbackSurveyRepository } from './feedback-survey-repository';
import type { FeedbackSurveyStore } from './feedback-survey-store';

export type PersistentFeedbackSurveyRepositoryOptions = {
  store: FeedbackSurveyStore;
};

class PersistentFeedbackSurveyRepository implements FeedbackSurveyRepository {
  private readonly store: FeedbackSurveyStore;
  private readonly byTreatment = new Map<string, FeedbackSurvey | null>();
  private readonly hydrated = new Set<string>();
  private queue: Promise<void> = Promise.resolve();

  constructor(store: FeedbackSurveyStore) {
    this.store = store;
  }

  getSurvey(treatmentId: string): Promise<FeedbackSurvey | null> {
    return this.enqueue(async () => {
      await this.hydrate(treatmentId);
      const stored = this.byTreatment.get(treatmentId) ?? null;
      return stored === null ? null : copyFeedbackSurvey(stored);
    });
  }

  submitSurvey(
    treatment: Treatment,
    submittedAt: string,
    answers: unknown,
  ): Promise<RecordFeedbackSurveyResult> {
    return this.enqueue(async () => {
      await this.hydrate(treatment.id);
      const existing = this.byTreatment.get(treatment.id) ?? null;
      const result = recordFeedbackSurvey({
        treatment,
        existing,
        submittedAt,
        answers,
      });

      if (result.status === 'recorded' && !result.alreadyPresent) {
        await this.store.save(treatment.id, result.survey);
        this.byTreatment.set(treatment.id, copyFeedbackSurvey(result.survey));
      }

      return result;
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async hydrate(treatmentId: string): Promise<void> {
    if (this.hydrated.has(treatmentId)) {
      return;
    }

    let stored: FeedbackSurvey | null = null;
    try {
      stored = await this.store.load(treatmentId);
    } catch {
      stored = null;
    }

    this.byTreatment.set(treatmentId, stored === null ? null : copyFeedbackSurvey(stored));
    this.hydrated.add(treatmentId);
  }
}

export function createPersistentFeedbackSurveyRepository(
  options: PersistentFeedbackSurveyRepositoryOptions,
): FeedbackSurveyRepository {
  return new PersistentFeedbackSurveyRepository(options.store);
}
