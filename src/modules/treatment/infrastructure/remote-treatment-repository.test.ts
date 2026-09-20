import { RetryableRemoteError } from '@/core/sync/remote-error';
import { createInMemoryWriteOutboxStore } from '@/core/sync/write-outbox';
import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import { calendarDate } from '../domain';

import type { CompletionOutboxPayload } from './map-remote-treatment';
import { createRemoteTreatmentRepository } from './remote-treatment-repository';
import type { TreatmentRemoteGateway } from './treatment-remote-gateway';

const ON_DATE = calendarDate(2026, 8, 20);

const CONTEXT: Extract<RemotePatientContextResult, { status: 'ready' }> = {
  status: 'ready',
  context: {
    authUserId: 'user-a',
    patientId: 'p1',
    clinicId: 'c1',
    pilotCohort: 'closed_beta',
    clinicTimeZone: 'Europe/Minsk',
    contact: {},
  },
};

function createGateway(options?: {
  failReads?: boolean;
  writeResult?: 'acked' | 'retry';
}): TreatmentRemoteGateway & { completions: { assignment_id: string; completed_on: string }[] } {
  const completions: { assignment_id: string; completed_on: string }[] = [];
  let failReads = options?.failReads ?? false;
  const writeResult = options?.writeResult ?? 'acked';

  const gateway: TreatmentRemoteGateway & {
    completions: typeof completions;
    setFailReads: (value: boolean) => void;
  } = {
    completions,
    setFailReads(value) {
      failReads = value;
    },
    async listTreatments() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return [
        {
          id: 't1',
          patient_id: 'p1',
          treatment_context: 'sclerotherapy',
          status: 'active',
          created_at: '2026-08-19T00:00:00.000Z',
        },
      ];
    },
    async listPeriods() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return [{ id: 'per1', started_on: '2026-08-19', ended_on: null }];
    },
    async listMilestones() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return [];
    },
    async listAssignments() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return [
        {
          id: 'a1',
          catalog_item_id: 'c1',
          title: 'Walk',
          instruction: null,
          start_date: '2026-08-19',
          end_date: '2026-08-30',
          status: 'active',
        },
      ];
    },
    async listCompletions() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return completions.map((row, index) => ({
        id: `row-${index}`,
        assignment_id: row.assignment_id,
        completed_on: row.completed_on,
      }));
    },
    async listAppointments() {
      if (failReads) {
        throw new RetryableRemoteError('offline');
      }
      return [];
    },
    async insertCompletion(input) {
      if (writeResult === 'retry') {
        return 'retry';
      }
      completions.push({
        assignment_id: input.assignmentId,
        completed_on: input.completedOn,
      });
      return 'acked';
    },
    async deleteCompletion(assignmentId, completedOn) {
      if (writeResult === 'retry') {
        return 'retry';
      }
      const index = completions.findIndex(
        (row) => row.assignment_id === assignmentId && row.completed_on === completedOn,
      );
      if (index >= 0) {
        completions.splice(index, 1);
      }
      return 'acked';
    },
  };

  return gateway;
}

describe('createRemoteTreatmentRepository', () => {
  it('returns null when the authenticated user is not linked to a patient', async () => {
    const repository = createRemoteTreatmentRepository({
      gateway: createGateway(),
      resolveContext: async () => ({ status: 'unlinked', authUserId: 'user-a' }),
      outboxStore: createInMemoryWriteOutboxStore<CompletionOutboxPayload>(),
      readAuthUserId: () => 'user-a',
    });

    await expect(repository.getActiveTreatment()).resolves.toBeNull();
  });

  it('returns the in-memory snapshot after a retryable refetch failure', async () => {
    const gateway = createGateway() as ReturnType<typeof createGateway> & {
      setFailReads: (value: boolean) => void;
    };
    const repository = createRemoteTreatmentRepository({
      gateway,
      resolveContext: async () => CONTEXT,
      outboxStore: createInMemoryWriteOutboxStore<CompletionOutboxPayload>(),
      readAuthUserId: () => 'user-a',
    });

    const first = await repository.getActiveTreatment();
    expect(first?.id).toBe('t1');

    gateway.setFailReads(true);
    const second = await repository.getActiveTreatment();
    expect(second?.id).toBe('t1');
    expect(second?.assignments).toHaveLength(1);
  });

  it('keeps an offline completion visible on reload via snapshot plus outbox', async () => {
    const gateway = createGateway({ writeResult: 'retry' }) as ReturnType<
      typeof createGateway
    > & { setFailReads: (value: boolean) => void };
    const repository = createRemoteTreatmentRepository({
      gateway,
      resolveContext: async () => CONTEXT,
      outboxStore: createInMemoryWriteOutboxStore<CompletionOutboxPayload>(),
      readAuthUserId: () => 'user-a',
    });

    await repository.getActiveTreatment();
    await repository.completeAssignment('a1', ON_DATE);

    gateway.setFailReads(true);
    const reloaded = await repository.getActiveTreatment();
    expect(reloaded?.completions).toHaveLength(1);
    expect(reloaded?.completions[0]?.assignmentId).toBe('a1');
  });

  it('queues complete then uncomplete and nets uncompleted after flush', async () => {
    const writeResult: { current: 'acked' | 'retry' } = { current: 'retry' };
    const gateway = createGateway();
    const originalInsert = gateway.insertCompletion.bind(gateway);
    const originalDelete = gateway.deleteCompletion.bind(gateway);
    gateway.insertCompletion = async (input) => {
      if (writeResult.current === 'retry') {
        return 'retry';
      }
      return originalInsert(input);
    };
    gateway.deleteCompletion = async (assignmentId, completedOn) => {
      if (writeResult.current === 'retry') {
        return 'retry';
      }
      return originalDelete(assignmentId, completedOn);
    };

    const store = createInMemoryWriteOutboxStore<CompletionOutboxPayload>();
    const repository = createRemoteTreatmentRepository({
      gateway,
      resolveContext: async () => CONTEXT,
      outboxStore: store,
      readAuthUserId: () => 'user-a',
    });

    await repository.completeAssignment('a1', ON_DATE);
    await repository.uncompleteAssignment('a1', ON_DATE);

    expect(store.items.map((item) => item.payload.op)).toEqual(['insert', 'delete']);

    writeResult.current = 'acked';
    const after = await repository.getActiveTreatment();
    expect(after?.completions).toEqual([]);
    expect(store.items).toEqual([]);
  });

  it('does not use another user snapshot after authUserId changes', async () => {
    const gateway = createGateway() as ReturnType<typeof createGateway> & {
      setFailReads: (value: boolean) => void;
    };
    let userId = 'user-a';
    const repository = createRemoteTreatmentRepository({
      gateway,
      resolveContext: async () =>
        userId === 'user-a'
          ? CONTEXT
          : { status: 'unlinked' as const, authUserId: userId },
      outboxStore: createInMemoryWriteOutboxStore<CompletionOutboxPayload>(),
      readAuthUserId: () => userId,
    });

    await expect(repository.getActiveTreatment()).resolves.toMatchObject({ id: 't1' });
    userId = 'user-b';
    gateway.setFailReads(true);
    await expect(repository.getActiveTreatment()).resolves.toBeNull();
  });
});
