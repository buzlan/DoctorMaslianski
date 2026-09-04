import {
  classifyPostgrestWriteError,
  RetryableRemoteError,
  type RemoteWriteResult,
} from '@/core/sync/remote-error';
import type { AppSupabaseClient } from '@/core/supabase/client';

import type {
  RemoteAppointmentRow,
  RemoteAssignmentRow,
  RemoteCompletionRow,
  RemoteMilestoneRow,
  RemotePeriodRow,
  RemoteTreatmentRow,
} from './map-remote-treatment';

export type InsertCompletionInput = {
  assignmentId: string;
  treatmentId: string;
  patientId: string;
  clinicId: string;
  completedOn: string;
};

export type TreatmentRemoteGateway = {
  listTreatments(patientId: string): Promise<RemoteTreatmentRow[]>;
  listPeriods(treatmentId: string): Promise<RemotePeriodRow[]>;
  listMilestones(treatmentId: string): Promise<RemoteMilestoneRow[]>;
  listAssignments(treatmentId: string): Promise<RemoteAssignmentRow[]>;
  listCompletions(treatmentId: string): Promise<RemoteCompletionRow[]>;
  listAppointments(treatmentId: string): Promise<RemoteAppointmentRow[]>;
  insertCompletion(input: InsertCompletionInput): Promise<RemoteWriteResult>;
  deleteCompletion(assignmentId: string, completedOn: string): Promise<RemoteWriteResult>;
};

function throwIfError(error: { message: string } | null): void {
  if (error !== null) {
    throw new RetryableRemoteError(error.message);
  }
}

export function createSupabaseTreatmentGateway(
  client: AppSupabaseClient,
): TreatmentRemoteGateway {
  return {
    async listTreatments(patientId) {
      const { data, error } = await client
        .from('treatments')
        .select('id, patient_id, treatment_context, status, created_at')
        .eq('patient_id', patientId);

      throwIfError(error);
      return (data ?? []) as RemoteTreatmentRow[];
    },
    async listPeriods(treatmentId) {
      const { data, error } = await client
        .from('treatment_periods')
        .select('id, started_on, ended_on')
        .eq('treatment_id', treatmentId);

      throwIfError(error);
      return (data ?? []) as RemotePeriodRow[];
    },
    async listMilestones(treatmentId) {
      const { data, error } = await client
        .from('treatment_milestones')
        .select('id, title, kind, occurred_on')
        .eq('treatment_id', treatmentId);

      throwIfError(error);
      return (data ?? []) as RemoteMilestoneRow[];
    },
    async listAssignments(treatmentId) {
      const { data, error } = await client
        .from('action_assignments')
        .select('id, catalog_item_id, title, instruction, start_date, end_date, status')
        .eq('treatment_id', treatmentId);

      throwIfError(error);
      return (data ?? []) as RemoteAssignmentRow[];
    },
    async listCompletions(treatmentId) {
      const { data, error } = await client
        .from('action_completions')
        .select('id, assignment_id, completed_on')
        .eq('treatment_id', treatmentId);

      throwIfError(error);
      return (data ?? []) as RemoteCompletionRow[];
    },
    async listAppointments(treatmentId) {
      const { data, error } = await client
        .from('appointments')
        .select('id, wall_clock, status')
        .eq('treatment_id', treatmentId);

      throwIfError(error);
      return (data ?? []) as RemoteAppointmentRow[];
    },
    async insertCompletion(input) {
      const { error } = await client.from('action_completions').insert({
        assignment_id: input.assignmentId,
        treatment_id: input.treatmentId,
        patient_id: input.patientId,
        clinic_id: input.clinicId,
        completed_on: input.completedOn,
      });

      return classifyPostgrestWriteError(error);
    },
    async deleteCompletion(assignmentId, completedOn) {
      const { error } = await client
        .from('action_completions')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('completed_on', completedOn);

      return classifyPostgrestWriteError(error);
    },
  };
}
