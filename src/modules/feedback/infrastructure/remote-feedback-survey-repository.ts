import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import {
  isRetryableRemoteError,
  RetryableRemoteError,
  classifyPostgrestWriteError,
  type RemoteWriteResult,
} from '@/core/sync/remote-error';
import {
  createWriteOutbox,
  nextOutboxItemId,
  type WriteOutboxStore,
} from '@/core/sync/write-outbox';
import type { AppSupabaseClient } from '@/core/supabase/client';
import type { Treatment } from '@/modules/treatment/domain';

import {
  copyFeedbackSurvey,
  recordFeedbackSurvey,
  type FeedbackSurvey,
  type RecordFeedbackSurveyResult,
} from '../domain';

import type { FeedbackSurveyRepository } from './feedback-survey-repository';

export type FeedbackOutboxPayload = {
  treatmentId: string;
  patientId: string;
  submittedAt: string;
  usefulnessScore: number;
  clarityScore: number;
};

export type FeedbackRemoteGateway = {
  getSurvey(treatmentId: string): Promise<FeedbackOutboxPayload | null>;
  insertSurvey(
    payload: FeedbackOutboxPayload & { clinicId: string },
  ): Promise<RemoteWriteResult>;
};

export function createSupabaseFeedbackGateway(
  client: AppSupabaseClient,
): FeedbackRemoteGateway {
  return {
    async getSurvey(treatmentId) {
      const { data, error } = await client
        .from('feedback_surveys')
        .select(
          'treatment_id, patient_id, submitted_at, usefulness_score, clarity_score',
        )
        .eq('treatment_id', treatmentId)
        .maybeSingle();

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      if (data === null) {
        return null;
      }

      return {
        treatmentId: data.treatment_id,
        patientId: data.patient_id,
        submittedAt: data.submitted_at,
        usefulnessScore: data.usefulness_score,
        clarityScore: data.clarity_score,
      };
    },
    async insertSurvey(payload) {
      const { error } = await client.from('feedback_surveys').insert({
        treatment_id: payload.treatmentId,
        patient_id: payload.patientId,
        clinic_id: payload.clinicId,
        submitted_at: payload.submittedAt,
        usefulness_score: payload.usefulnessScore,
        clarity_score: payload.clarityScore,
      });

      return classifyPostgrestWriteError(error);
    },
  };
}

export type RemoteFeedbackSurveyRepositoryOptions = {
  gateway: FeedbackRemoteGateway;
  resolveContext: () => Promise<RemotePatientContextResult>;
  outboxStore: WriteOutboxStore<FeedbackOutboxPayload>;
  readAuthUserId: () => string | null;
};

type FeedbackSnapshot = {
  authUserId: string;
  treatmentId: string;
  survey: FeedbackSurvey | null;
};

function surveyFromPayload(payload: FeedbackOutboxPayload): FeedbackSurvey {
  return {
    id: `${payload.treatmentId}:feedback`,
    treatmentId: payload.treatmentId,
    patientId: payload.patientId,
    submittedAt: payload.submittedAt,
    usefulnessScore: payload.usefulnessScore as FeedbackSurvey['usefulnessScore'],
    clarityScore: payload.clarityScore as FeedbackSurvey['clarityScore'],
  };
}

export function createRemoteFeedbackSurveyRepository(
  options: RemoteFeedbackSurveyRepositoryOptions,
): FeedbackSurveyRepository {
  let snapshot: FeedbackSnapshot | null = null;

  const outbox = createWriteOutbox({
    store: options.outboxStore,
    async flushItem(item) {
      const currentUserId = options.readAuthUserId();
      if (currentUserId !== item.authUserId) {
        return 'retry';
      }

      const context = await options.resolveContext();
      if (context.status !== 'ready' || context.context.authUserId !== item.authUserId) {
        return 'retry';
      }

      const result = await options.gateway.insertSurvey({
        ...item.payload,
        patientId: context.context.patientId,
        clinicId: context.context.clinicId,
      });

      if (result === 'acked' || result === 'conflict' || result === 'integrity') {
        return 'acked';
      }

      return 'retry';
    },
  });

  async function present(
    authUserId: string,
    treatmentId: string,
    survey: FeedbackSurvey | null,
  ): Promise<FeedbackSurvey | null> {
    if (survey !== null) {
      return copyFeedbackSurvey(survey);
    }

    const items = await options.outboxStore.load();
    const pending = items.find(
      (item) => item.authUserId === authUserId && item.treatmentId === treatmentId,
    );
    return pending === undefined ? null : surveyFromPayload(pending.payload);
  }

  async function loadSurvey(treatmentId: string): Promise<FeedbackSurvey | null> {
    const authUserId = options.readAuthUserId();
    await outbox.flush(authUserId);

    const context = await options.resolveContext();
    if (context.status === 'unauthenticated' || context.status === 'unlinked') {
      snapshot = null;
      return null;
    }

    if (context.status === 'error') {
      if (authUserId === null) {
        throw new RetryableRemoteError('remote patient context unavailable');
      }

      if (
        snapshot !== null &&
        snapshot.authUserId === authUserId &&
        snapshot.treatmentId === treatmentId
      ) {
        return present(authUserId, treatmentId, snapshot.survey);
      }

      throw new RetryableRemoteError('remote patient context unavailable');
    }

    try {
      const row = await options.gateway.getSurvey(treatmentId);
      const survey = row === null ? null : surveyFromPayload(row);
      snapshot = {
        authUserId: context.context.authUserId,
        treatmentId,
        survey,
      };
      return present(context.context.authUserId, treatmentId, survey);
    } catch (error) {
      if (!isRetryableRemoteError(error)) {
        throw error;
      }

      if (
        snapshot !== null &&
        snapshot.authUserId === context.context.authUserId &&
        snapshot.treatmentId === treatmentId
      ) {
        return present(context.context.authUserId, treatmentId, snapshot.survey);
      }

      throw error;
    }
  }

  return {
    getSurvey(treatmentId) {
      return loadSurvey(treatmentId);
    },
    async submitSurvey(
      treatment: Treatment,
      submittedAt: string,
      answers: unknown,
    ): Promise<RecordFeedbackSurveyResult> {
      const existing = await loadSurvey(treatment.id);
      const result = recordFeedbackSurvey({
        treatment,
        existing,
        submittedAt,
        answers,
      });

      if (result.status === 'ignored') {
        return result;
      }

      const authUserId = options.readAuthUserId();
      if (authUserId !== null) {
        snapshot = {
          authUserId,
          treatmentId: treatment.id,
          survey: result.survey,
        };
      }

      if (!result.alreadyPresent && authUserId !== null) {
        await outbox.enqueue({
          id: nextOutboxItemId(),
          authUserId,
          treatmentId: treatment.id,
          createdAt: new Date().toISOString(),
          payload: {
            treatmentId: treatment.id,
            patientId: treatment.patientId,
            submittedAt: result.survey.submittedAt,
            usefulnessScore: result.survey.usefulnessScore,
            clarityScore: result.survey.clarityScore,
          },
        });
        await outbox.flush(authUserId);
      }

      return result;
    },
  };
}
