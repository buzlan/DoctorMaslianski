import {
  classifyPostgrestWriteError,
  RetryableRemoteError,
  type RemoteWriteResult,
} from '@/core/sync/remote-error';
import type { AppSupabaseClient } from '@/core/supabase/client';

import type { DiaryOutboxPayload, RemoteDiaryEntryRow } from './map-remote-diary';

export type DiaryRemoteGateway = {
  listEntries(treatmentId: string): Promise<RemoteDiaryEntryRow[]>;
  insertEntry(payload: DiaryOutboxPayload & { clinicId: string }): Promise<RemoteWriteResult>;
};

export function createSupabaseDiaryGateway(client: AppSupabaseClient): DiaryRemoteGateway {
  return {
    async listEntries(treatmentId) {
      const { data, error } = await client
        .from('diary_entries')
        .select('id, treatment_id, patient_id, submitted_on, pain, swelling, wellbeing')
        .eq('treatment_id', treatmentId);

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      return (data ?? []) as RemoteDiaryEntryRow[];
    },
    async insertEntry(payload) {
      const { error } = await client.from('diary_entries').insert({
        treatment_id: payload.treatmentId,
        patient_id: payload.patientId,
        clinic_id: payload.clinicId,
        submitted_on: payload.submittedOn,
        pain: payload.pain,
        swelling: payload.swelling,
        wellbeing: payload.wellbeing,
      });

      return classifyPostgrestWriteError(error);
    },
  };
}
