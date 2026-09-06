import { createRemoteProductEventSink } from './remote-product-event-sink';
import { DEVELOPMENT_PILOT_COHORT, type ProductEvent } from '../domain';
import { createInMemoryWriteOutboxStore } from '@/core/sync/write-outbox';
import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import type { ProductEventOutboxPayload } from './remote-product-event-sink';

const EVENT: ProductEvent = {
  name: 'task_completed',
  at: '2026-09-04T10:00:00.000Z',
  pilotCohort: DEVELOPMENT_PILOT_COHORT,
  patientId: 'p1',
  treatmentId: 't1',
  entityId: 'a1:2026-9-4',
};

describe('createRemoteProductEventSink', () => {
  it('does not insert when the authenticated patient cohort is null', async () => {
    const inserted: unknown[] = [];
    const store = createInMemoryWriteOutboxStore<ProductEventOutboxPayload>();
    const sink = createRemoteProductEventSink({
      gateway: {
        async insertEvent(row) {
          inserted.push(row);
          return 'acked';
        },
      },
      resolveContext: async (): Promise<RemotePatientContextResult> => ({
        status: 'ready',
        context: {
          authUserId: 'user-a',
          patientId: 'p1',
          clinicId: 'c1',
          pilotCohort: null,
          clinicTimeZone: 'Europe/Minsk',
          contact: {},
        },
      }),
      outboxStore: store,
      readAuthUserId: () => 'user-a',
    });

    await sink.append(EVENT);

    expect(inserted).toEqual([]);
    expect(store.items).toHaveLength(1);
  });

  it('does not flush another user queued events', async () => {
    const inserted: unknown[] = [];
    const store = createInMemoryWriteOutboxStore<ProductEventOutboxPayload>();
    store.items.push({
      id: 'queued-a',
      authUserId: 'user-a',
      treatmentId: 't1',
      createdAt: '2026-09-04T10:00:00.000Z',
      payload: { event: EVENT },
    });

    const sink = createRemoteProductEventSink({
      gateway: {
        async insertEvent(row) {
          inserted.push(row);
          return 'acked';
        },
      },
      resolveContext: async (): Promise<RemotePatientContextResult> => ({
        status: 'ready',
        context: {
          authUserId: 'user-b',
          patientId: 'p2',
          clinicId: 'c1',
          pilotCohort: 'clinic_pilot',
          clinicTimeZone: 'Europe/Minsk',
          contact: {},
        },
      }),
      outboxStore: store,
      readAuthUserId: () => 'user-b',
    });

    await sink.flush();

    expect(inserted).toEqual([]);
    expect(store.items[0]?.authUserId).toBe('user-a');
  });
});
