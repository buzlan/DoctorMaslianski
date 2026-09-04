import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import { createInMemoryWriteOutboxStore } from '@/core/sync/write-outbox';
import { RetryableRemoteError } from '@/core/sync/remote-error';
import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';

import { mapRemoteDiaryEntry, type DiaryOutboxPayload } from './map-remote-diary';
import { createRemoteDiaryRepository } from './remote-diary-repository';
import type { DiaryRemoteGateway } from './diary-remote-gateway';

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

const TREATMENT = createTreatment({
  id: 't1',
  patientId: 'p1',
  status: 'active',
});

describe('mapRemoteDiaryEntry', () => {
  it('maps a remote row without putting answers on a ProductEvent', () => {
    const entry = mapRemoteDiaryEntry({
      id: 'row-1',
      treatment_id: 't1',
      patient_id: 'p1',
      submitted_on: '2026-08-20',
      pain: 3,
      swelling: 1,
      wellbeing: 'better',
    });

    expect(entry).toMatchObject({
      treatmentId: 't1',
      pain: 3,
      swelling: 1,
      wellbeing: 'better',
      submittedOn: ON_DATE,
    });
  });
});

describe('createRemoteDiaryRepository', () => {
  it('returns snapshot plus pending outbox when a refetch fails after an offline submit', async () => {
    let failReads = false;
    const gateway: DiaryRemoteGateway = {
      async listEntries() {
        if (failReads) {
          throw new RetryableRemoteError('offline');
        }
        return [];
      },
      async insertEntry() {
        return 'retry';
      },
    };

    const repository = createRemoteDiaryRepository({
      gateway,
      resolveContext: async () => CONTEXT,
      outboxStore: createInMemoryWriteOutboxStore<DiaryOutboxPayload>(),
      readAuthUserId: () => 'user-a',
    });

    await repository.listEntries('t1');
    const submitted = await repository.submitEntry(TREATMENT, ON_DATE, {
      pain: 2,
      swelling: 4,
      wellbeing: 'unchanged',
    });
    expect(submitted.status).toBe('recorded');

    failReads = true;
    const reloaded = await repository.getEntryOnDate('t1', ON_DATE);
    expect(reloaded?.pain).toBe(2);
  });
});
