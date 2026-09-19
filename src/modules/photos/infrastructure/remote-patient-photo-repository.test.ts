import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import { createInMemoryWriteOutboxStore } from '@/core/sync/write-outbox';
import { createInMemoryProductEventSink } from '@/modules/product-events';
import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';

import { createInMemoryPatientPhotoFileOps } from './in-memory-patient-photo-file-ops';
import type { PatientPhotoOutboxPayload } from './map-remote-patient-photo';
import type { PatientPhotoRemoteGateway } from './patient-photo-remote-gateway';
import { createRemotePatientPhotoRepository } from './remote-patient-photo-repository';

const ON_DATE = calendarDate(2026, 8, 9);
const AT = '2026-08-09T12:00:00.000Z';
const PHOTO_ID = '11111111-1111-4111-8111-111111111111';
const BYTES = new ArrayBuffer(8);

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

function captured() {
  return { sourceUri: 'file:///cache/a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg' };
}

function createGateway(overrides: Partial<PatientPhotoRemoteGateway> = {}): PatientPhotoRemoteGateway & {
  uploads: { path: string; bytes: ArrayBuffer; contentType: string }[];
  inserts: number;
} {
  const uploads: { path: string; bytes: ArrayBuffer; contentType: string }[] = [];
  let inserts = 0;

  return {
    uploads,
    get inserts() {
      return inserts;
    },
    async listPhotos() {
      return [];
    },
    async insertPhoto() {
      inserts += 1;
      return 'acked';
    },
    async selectBySlot() {
      return null;
    },
    async uploadObject(input) {
      uploads.push(input);
      return 'acked';
    },
    ...overrides,
  };
}

function createRepository(
  gateway: PatientPhotoRemoteGateway,
  extras?: {
    eventSink?: ReturnType<typeof createInMemoryProductEventSink>;
    outboxStore?: ReturnType<typeof createInMemoryWriteOutboxStore<PatientPhotoOutboxPayload>>;
    fileOps?: ReturnType<typeof createInMemoryPatientPhotoFileOps>;
    readAuthUserId?: () => string | null;
    resolveContext?: () => Promise<RemotePatientContextResult>;
    createId?: () => string;
  },
) {
  const eventSink = extras?.eventSink ?? createInMemoryProductEventSink();
  const outboxStore =
    extras?.outboxStore ?? createInMemoryWriteOutboxStore<PatientPhotoOutboxPayload>();
  const fileOps = extras?.fileOps ?? createInMemoryPatientPhotoFileOps();

  return {
    eventSink,
    outboxStore,
    fileOps,
    repository: createRemotePatientPhotoRepository({
      gateway,
      resolveContext: extras?.resolveContext ?? (async () => CONTEXT),
      outboxStore,
      readAuthUserId: extras?.readAuthUserId ?? (() => 'user-a'),
      fileOps,
      eventSink,
      now: () => new Date(AT),
      createId: extras?.createId ?? (() => PHOTO_ID),
      readFileBytes: async () => BYTES,
    }),
  };
}

describe('createRemotePatientPhotoRepository', () => {
  it('uploads an ArrayBuffer with upsert false after metadata insert', async () => {
    const gateway = createGateway();
    const { repository, eventSink, fileOps } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());

    expect(result.status).toBe('recorded');
    expect(gateway.uploads).toHaveLength(1);
    expect(gateway.uploads[0]?.bytes).toBe(BYTES);
    expect(gateway.uploads[0]?.bytes).toBeInstanceOf(ArrayBuffer);
    expect(gateway.uploads[0]?.contentType).toBe('image/jpeg');
    expect(gateway.uploads[0]?.path).toBe(
      `c1/p1/t1/2026-08-09/${PHOTO_ID}.jpg`,
    );
    expect(eventSink.getAll()).toEqual([
      {
        name: 'patient_photo_added',
        at: AT,
        pilotCohort: 'closed_beta',
        patientId: 'p1',
        treatmentId: 't1',
        entityId: PHOTO_ID,
      },
    ]);
    expect(eventSink.getAll()[0]).not.toHaveProperty('mimeType');
    expect(eventSink.getAll()[0]).not.toHaveProperty('uri');
    expect(fileOps.removed).toEqual([`t1/${PHOTO_ID.replace(/[^A-Za-z0-9._-]/g, '_')}.jpg`]);
  });

  it('retries upload when metadata exists and the object is still missing', async () => {
    let uploads = 0;
    const gateway = createGateway({
      async insertPhoto() {
        return 'conflict';
      },
      async selectBySlot() {
        return {
          id: PHOTO_ID,
          treatment_id: 't1',
          patient_id: 'p1',
          submitted_on: '2026-08-09',
          slot: 1,
        };
      },
      async uploadObject(input) {
        uploads += 1;
        gateway.uploads.push(input);
        return uploads === 1 ? 'retry' : 'acked';
      },
    });
    const { repository, eventSink, outboxStore } = createRepository(gateway);

    const first = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(first.status).toBe('queued');
    expect(eventSink.getAll()).toEqual([]);
    expect(outboxStore.items).toHaveLength(1);

    await repository.listPhotos('t1');
    expect(uploads).toBe(2);
    expect(eventSink.getAll()).toHaveLength(1);
    expect(outboxStore.items).toHaveLength(0);
  });

  it('treats a same-path object-already-exists upload as success', async () => {
    const gateway = createGateway({
      async uploadObject(input) {
        gateway.uploads.push(input);
        return 'duplicate';
      },
    });
    const { repository, eventSink } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('recorded');
    expect(eventSink.getAll()).toHaveLength(1);
  });

  it('keeps the photo pending on retryable storage errors', async () => {
    const gateway = createGateway({
      async uploadObject() {
        return 'retry';
      },
    });
    const { repository, eventSink, outboxStore } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('queued');
    expect(eventSink.getAll()).toEqual([]);
    expect(outboxStore.items).toHaveLength(1);
  });

  it('abandons a slot taken by a different photo id without emitting', async () => {
    const gateway = createGateway({
      async insertPhoto() {
        return 'conflict';
      },
      async selectBySlot() {
        return {
          id: 'other-photo',
          treatment_id: 't1',
          patient_id: 'p1',
          submitted_on: '2026-08-09',
          slot: 1,
        };
      },
    });
    const { repository, eventSink, outboxStore, fileOps } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('recorded');
    expect(eventSink.getAll()).toEqual([]);
    expect(outboxStore.items).toHaveLength(0);
    expect(gateway.uploads).toHaveLength(0);
    expect(fileOps.removed).toHaveLength(1);
  });

  it('drops integrity failures without emitting', async () => {
    const gateway = createGateway({
      async insertPhoto() {
        return 'integrity';
      },
    });
    const { repository, eventSink, outboxStore } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('recorded');
    expect(eventSink.getAll()).toEqual([]);
    expect(outboxStore.items).toHaveLength(0);
  });

  it('drops permanent storage validation failures without treating them as duplicates', async () => {
    const gateway = createGateway({
      async uploadObject() {
        return 'integrity';
      },
    });
    const { repository, eventSink, outboxStore } = createRepository(gateway);

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('recorded');
    expect(eventSink.getAll()).toEqual([]);
    expect(outboxStore.items).toHaveLength(0);
  });

  it('does not ack the photo outbox when analytics append fails', async () => {
    const gateway = createGateway();
    const eventSink = createInMemoryProductEventSink();
    const originalAppend = eventSink.append.bind(eventSink);
    eventSink.append = async () => {
      throw new Error('event outbox unavailable');
    };
    const { repository, outboxStore } = createRepository(gateway, { eventSink });

    const result = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(result.status).toBe('queued');
    expect(outboxStore.items).toHaveLength(1);

    eventSink.append = originalAppend;
    await repository.listPhotos('t1');
    expect(eventSink.getAll()).toHaveLength(1);
    expect(outboxStore.items).toHaveLength(0);
  });

  it('counts pending outbox photos toward the daily cap', async () => {
    let nextId = 0;
    const gateway = createGateway({
      async uploadObject() {
        return 'retry';
      },
    });
    const { repository } = createRepository(gateway, {
      createId: () => `photo-${(nextId += 1)}`,
    });

    await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    const fourth = await repository.recordPhoto(TREATMENT, ON_DATE, captured());
    expect(fourth).toEqual({ status: 'ignored', reason: 'daily_cap_reached' });
  });

  it('does not flush another user pending photos', async () => {
    const gateway = createGateway();
    const outboxStore = createInMemoryWriteOutboxStore<PatientPhotoOutboxPayload>();
    await outboxStore.save([
      {
        id: 'other',
        authUserId: 'user-b',
        treatmentId: 't1',
        createdAt: AT,
        payload: {
          photoId: 'other-photo',
          treatmentId: 't1',
          patientId: 'p2',
          submittedOn: '2026-08-09',
          slot: 1,
          contentType: 'image/jpeg',
          extension: 'jpg',
          localFileRef: 'other.jpg',
        },
      },
    ]);
    const { repository } = createRepository(gateway, { outboxStore });

    await repository.listPhotos('t1');
    expect(outboxStore.items).toHaveLength(1);
    expect(outboxStore.items[0]?.authUserId).toBe('user-b');
    expect(gateway.uploads).toHaveLength(0);
  });
});
