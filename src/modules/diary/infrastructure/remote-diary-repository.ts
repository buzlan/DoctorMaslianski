import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import {
  isRetryableRemoteError,
  RetryableRemoteError,
} from '@/core/sync/remote-error';
import {
  createWriteOutbox,
  nextOutboxItemId,
  type WriteOutboxStore,
} from '@/core/sync/write-outbox';
import { isSameCalendarDate, type CalendarDate, type Treatment } from '@/modules/treatment/domain';
import { formatCivilDate } from '@/shared/date/civil-date';

import { recordDiaryEntry, type DiaryEntry } from '../domain';

import type { DiaryRemoteGateway } from './diary-remote-gateway';
import type { DiaryRepository, SubmitDiaryEntryResult } from './diary-repository';
import {
  applyDiaryOutbox,
  mapRemoteDiaryEntry,
  type DiaryOutboxPayload,
} from './map-remote-diary';

export type RemoteDiaryRepositoryOptions = {
  gateway: DiaryRemoteGateway;
  resolveContext: () => Promise<RemotePatientContextResult>;
  outboxStore: WriteOutboxStore<DiaryOutboxPayload>;
  readAuthUserId: () => string | null;
};

type DiarySnapshot = {
  authUserId: string;
  treatmentId: string;
  entries: readonly DiaryEntry[];
};

export function createRemoteDiaryRepository(
  options: RemoteDiaryRepositoryOptions,
): DiaryRepository {
  let snapshot: DiarySnapshot | null = null;

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

      const result = await options.gateway.insertEntry({
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

  function snapshotFor(authUserId: string, treatmentId: string): readonly DiaryEntry[] | null {
    if (snapshot === null) {
      return null;
    }

    if (snapshot.authUserId !== authUserId) {
      snapshot = null;
      return null;
    }

    if (snapshot.treatmentId !== treatmentId) {
      return null;
    }

    return snapshot.entries;
  }

  async function present(
    authUserId: string,
    treatmentId: string,
    entries: readonly DiaryEntry[],
  ): Promise<readonly DiaryEntry[]> {
    const items = await options.outboxStore.load();
    return applyDiaryOutbox(entries, items, authUserId, treatmentId);
  }

  async function fetchEntries(
    authUserId: string,
    treatmentId: string,
  ): Promise<readonly DiaryEntry[]> {
    const rows = await options.gateway.listEntries(treatmentId);
    const entries = rows
      .map(mapRemoteDiaryEntry)
      .filter((entry): entry is DiaryEntry => entry !== null);
    snapshot = { authUserId, treatmentId, entries };
    return entries;
  }

  async function loadPresented(treatmentId: string): Promise<readonly DiaryEntry[]> {
    const authUserId = options.readAuthUserId();
    await outbox.flush(authUserId);

    const context = await options.resolveContext();
    if (context.status === 'unauthenticated' || context.status === 'unlinked') {
      snapshot = null;
      return [];
    }

    if (context.status === 'error') {
      if (authUserId === null) {
        throw new RetryableRemoteError('remote patient context unavailable');
      }

      const previous = snapshotFor(authUserId, treatmentId);
      if (previous === null) {
        throw new RetryableRemoteError('remote patient context unavailable');
      }

      return present(authUserId, treatmentId, previous);
    }

    try {
      const fetched = await fetchEntries(context.context.authUserId, treatmentId);
      return present(context.context.authUserId, treatmentId, fetched);
    } catch (error) {
      if (!isRetryableRemoteError(error)) {
        throw error;
      }

      const previous = snapshotFor(context.context.authUserId, treatmentId);
      if (previous === null) {
        throw error;
      }

      return present(context.context.authUserId, treatmentId, previous);
    }
  }

  return {
    async listEntries(treatmentId) {
      return loadPresented(treatmentId);
    },
    async getEntryOnDate(treatmentId, onDate) {
      const entries = await loadPresented(treatmentId);
      return (
        entries.find((entry) => isSameCalendarDate(entry.submittedOn, onDate)) ?? null
      );
    },
    async submitEntry(
      treatment: Treatment,
      onDate: CalendarDate,
      answers: { pain: number; swelling: number; wellbeing: string },
    ): Promise<SubmitDiaryEntryResult> {
      const existingEntries = await loadPresented(treatment.id);
      const result = recordDiaryEntry({
        treatment,
        existingEntries,
        onDate,
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
          entries: result.entries,
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
            submittedOn: formatCivilDate(onDate),
            pain: result.entry.pain,
            swelling: result.entry.swelling,
            wellbeing: result.entry.wellbeing,
          },
        });
        await outbox.flush(authUserId);
      }

      return {
        status: 'recorded',
        entry: result.entry,
        alreadyPresent: result.alreadyPresent,
      };
    },
  };
}
