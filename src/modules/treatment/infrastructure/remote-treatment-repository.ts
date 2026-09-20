import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import {
  isRetryableRemoteError,
  RetryableRemoteError,
} from '@/core/sync/remote-error';
import {
  createWriteOutbox,
  nextOutboxItemId,
  type WriteOutbox,
  type WriteOutboxItem,
  type WriteOutboxStore,
} from '@/core/sync/write-outbox';
import {
  clearAssignmentCompletion,
  createTreatment,
  recordAssignmentCompletion,
  type CalendarDate,
  type Treatment,
} from '../domain';

import {
  applyCompletionOutbox,
  civilDateString,
  mapRemoteTreatment,
  selectCurrentTreatment,
  type CompletionOutboxPayload,
} from './map-remote-treatment';
import type { TreatmentRemoteGateway } from './treatment-remote-gateway';
import type {
  CompleteAssignmentResult,
  TreatmentRepository,
  UncompleteAssignmentResult,
} from './treatment-repository';

export type RemoteTreatmentRepositoryOptions = {
  gateway: TreatmentRemoteGateway;
  resolveContext: () => Promise<RemotePatientContextResult>;
  outboxStore: WriteOutboxStore<CompletionOutboxPayload>;
  readAuthUserId: () => string | null;
};

type TreatmentSnapshot = {
  authUserId: string;
  treatment: Treatment;
};

function withCompletions(treatment: Treatment, completions: Treatment['completions']): Treatment {
  return createTreatment({
    id: treatment.id,
    patientId: treatment.patientId,
    status: treatment.status,
    periods: treatment.periods,
    milestones: treatment.milestones,
    assignments: treatment.assignments,
    appointments: treatment.appointments,
    completions,
  });
}

export function createRemoteTreatmentRepository(
  options: RemoteTreatmentRepositoryOptions,
): TreatmentRepository {
  let snapshot: TreatmentSnapshot | null = null;
  let pendingItems: WriteOutboxItem<CompletionOutboxPayload>[] = [];

  const outbox: WriteOutbox<CompletionOutboxPayload> = createWriteOutbox({
    store: {
      async load() {
        pendingItems = [...(await options.outboxStore.load())];
        return pendingItems;
      },
      async save(items) {
        pendingItems = [...items];
        await options.outboxStore.save(items);
      },
    },
    async flushItem(item) {
      const currentUserId = options.readAuthUserId();
      if (currentUserId !== item.authUserId) {
        return 'retry';
      }

      const result =
        item.payload.op === 'insert'
          ? await resolveInsert(item)
          : await options.gateway.deleteCompletion(
              item.payload.assignmentId,
              item.payload.completedOn,
            );

      if (result === 'acked' || result === 'conflict') {
        return 'acked';
      }

      if (result === 'integrity') {
        return 'acked';
      }

      return 'retry';
    },
  });

  async function resolveInsert(
    item: WriteOutboxItem<CompletionOutboxPayload>,
  ): Promise<'acked' | 'conflict' | 'retry' | 'integrity'> {
    const context = await options.resolveContext();
    if (context.status !== 'ready' || context.context.authUserId !== item.authUserId) {
      return 'retry';
    }

    if (item.treatmentId === undefined) {
      return 'integrity';
    }

    return options.gateway.insertCompletion({
      assignmentId: item.payload.assignmentId,
      treatmentId: item.treatmentId,
      patientId: context.context.patientId,
      clinicId: context.context.clinicId,
      completedOn: item.payload.completedOn,
    });
  }

  async function pendingFor(authUserId: string, treatmentId: string) {
    const items = await options.outboxStore.load();
    pendingItems = [...items];
    return items.filter(
      (item) => item.authUserId === authUserId && item.treatmentId === treatmentId,
    );
  }

  function snapshotFor(authUserId: string): Treatment | null {
    if (snapshot === null || snapshot.authUserId !== authUserId) {
      snapshot = null;
      return null;
    }

    return snapshot.treatment;
  }

  async function fetchTreatment(authUserId: string, patientId: string): Promise<Treatment | null> {
    const treatments = await options.gateway.listTreatments(patientId);
    const selected = selectCurrentTreatment(treatments);
    if (selected === null) {
      snapshot = null;
      return null;
    }

    const [periods, milestones, assignments, completions, appointments] = await Promise.all([
      options.gateway.listPeriods(selected.id),
      options.gateway.listMilestones(selected.id),
      options.gateway.listAssignments(selected.id),
      options.gateway.listCompletions(selected.id),
      options.gateway.listAppointments(selected.id),
    ]);

    const mapped = mapRemoteTreatment({
      treatment: selected,
      periods,
      milestones,
      assignments,
      completions,
      appointments,
    });

    snapshot = { authUserId, treatment: mapped };
    return mapped;
  }

  async function present(authUserId: string, treatment: Treatment): Promise<Treatment> {
    const overlay = await pendingFor(authUserId, treatment.id);
    return withCompletions(
      treatment,
      applyCompletionOutbox(treatment.completions, overlay, authUserId, treatment.id),
    );
  }

  return {
    async getActiveTreatment() {
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

        const previous = snapshotFor(authUserId);
        if (previous === null) {
          throw new RetryableRemoteError('remote patient context unavailable');
        }

        return present(authUserId, previous);
      }

      try {
        const fetched = await fetchTreatment(context.context.authUserId, context.context.patientId);
        if (fetched === null) {
          return null;
        }

        return present(context.context.authUserId, fetched);
      } catch (error) {
        if (!isRetryableRemoteError(error)) {
          throw error;
        }

        const previous = snapshotFor(context.context.authUserId);
        if (previous === null) {
          throw error;
        }

        return present(context.context.authUserId, previous);
      }
    },

    async completeAssignment(assignmentId: string, onDate: CalendarDate) {
      const treatment = await this.getActiveTreatment();
      if (treatment === null) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      const result = recordAssignmentCompletion(treatment, assignmentId, onDate);
      if (result.status === 'ignored') {
        return result;
      }

      const authUserId = options.readAuthUserId();
      if (authUserId === null) {
        return result.status === 'recorded'
          ? {
              status: 'recorded' as const,
              completion: result.completion,
              alreadyPresent: result.alreadyPresent,
              patientId: treatment.patientId,
              treatmentId: treatment.id,
            }
          : result;
      }

      snapshot = { authUserId, treatment: result.treatment };

      if (!result.alreadyPresent) {
        await outbox.enqueue({
          id: nextOutboxItemId(),
          authUserId,
          treatmentId: treatment.id,
          createdAt: new Date().toISOString(),
          payload: {
            op: 'insert',
            assignmentId,
            completedOn: civilDateString(onDate),
          },
        });
        await outbox.flush(authUserId);
      }

      const recorded: CompleteAssignmentResult = {
        status: 'recorded',
        completion: result.completion,
        alreadyPresent: result.alreadyPresent,
        patientId: treatment.patientId,
        treatmentId: treatment.id,
      };
      return recorded;
    },

    async uncompleteAssignment(assignmentId: string, onDate: CalendarDate) {
      const treatment = await this.getActiveTreatment();
      if (treatment === null) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      const result = clearAssignmentCompletion(treatment, assignmentId, onDate);
      if (result.status === 'ignored') {
        return result;
      }

      const authUserId = options.readAuthUserId();
      if (authUserId === null) {
        return {
          status: 'cleared' as const,
          alreadyAbsent: result.alreadyAbsent,
        };
      }

      snapshot = { authUserId, treatment: result.treatment };

      if (!result.alreadyAbsent) {
        await outbox.enqueue({
          id: nextOutboxItemId(),
          authUserId,
          treatmentId: treatment.id,
          createdAt: new Date().toISOString(),
          payload: {
            op: 'delete',
            assignmentId,
            completedOn: civilDateString(onDate),
          },
        });
        await outbox.flush(authUserId);
      }

      const cleared: UncompleteAssignmentResult = {
        status: 'cleared',
        alreadyAbsent: result.alreadyAbsent,
      };
      return cleared;
    },
  };
}
