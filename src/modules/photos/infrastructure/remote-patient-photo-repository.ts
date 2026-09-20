import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import {
  isRetryableRemoteError,
  RetryableRemoteError,
} from '@/core/sync/remote-error';
import {
  createWriteOutbox,
  nextOutboxItemId,
  type WriteOutboxItem,
  type WriteOutboxStore,
} from '@/core/sync/write-outbox';
import type { ProductEventSink } from '@/modules/product-events';
import { isActiveTreatment, type CalendarDate, type Treatment } from '@/modules/treatment/domain';
import { formatCivilDate, parseCivilDate } from '@/shared/date/civil-date';
import { createRandomUuid } from '@/shared/id/random-uuid';

import {
  contentTypeForExtension,
  createPatientPhoto,
  nextPatientPhotoSlot,
  patientPhotoFileRef,
  PATIENT_PHOTO_MAX_BYTES,
  recordPatientPhoto,
  resolveSourceExtension,
  type CapturedImage,
  type PatientPhoto,
} from '../domain';

import type { PatientPhotoFileOps } from './patient-photo-file-ops';
import { copyPhoto } from './patient-photo-store-codec';
import {
  applyPatientPhotoOutbox,
  mapRemotePatientPhoto,
  type PatientPhotoOutboxPayload,
} from './map-remote-patient-photo';
import {
  readLocalFileArrayBuffer,
  type PatientPhotoRemoteGateway,
} from './patient-photo-remote-gateway';
import type {
  PatientPhotoRepository,
  RecordCapturedPatientPhotoResult,
} from './patient-photo-repository';
import { patientPhotoStoragePath } from './patient-photo-storage-path';

export type RemotePatientPhotoRepositoryOptions = {
  gateway: PatientPhotoRemoteGateway;
  resolveContext: () => Promise<RemotePatientContextResult>;
  outboxStore: WriteOutboxStore<PatientPhotoOutboxPayload>;
  readAuthUserId: () => string | null;
  fileOps: PatientPhotoFileOps;
  eventSink: ProductEventSink;
  now?: () => Date;
  createId?: () => string;
  readFileBytes?: (uri: string) => Promise<ArrayBuffer>;
};

type PhotoSnapshot = {
  authUserId: string;
  treatmentId: string;
  photos: readonly PatientPhoto[];
};

export function createRemotePatientPhotoRepository(
  options: RemotePatientPhotoRepositoryOptions,
): PatientPhotoRepository {
  let snapshot: PhotoSnapshot | null = null;
  const createId = options.createId ?? createRandomUuid;
  const now = options.now ?? (() => new Date());
  const readFileBytes = options.readFileBytes ?? readLocalFileArrayBuffer;

  const outbox = createWriteOutbox({
    store: options.outboxStore,
    async flushItem(item) {
      return flushPhotoItem(item);
    },
  });

  async function flushPhotoItem(
    item: WriteOutboxItem<PatientPhotoOutboxPayload>,
  ): Promise<'acked' | 'retry'> {
    const currentUserId = options.readAuthUserId();
    if (currentUserId !== item.authUserId) {
      return 'retry';
    }

    const context = await options.resolveContext();
    if (context.status !== 'ready' || context.context.authUserId !== item.authUserId) {
      return 'retry';
    }

    const submittedOn = parseCivilDate(item.payload.submittedOn);
    if (submittedOn === null) {
      return 'acked';
    }

    const path = patientPhotoStoragePath({
      clinicId: context.context.clinicId,
      patientId: context.context.patientId,
      treatmentId: item.payload.treatmentId,
      submittedOn,
      photoId: item.payload.photoId,
      extension: item.payload.extension,
    });
    if (path === null) {
      return 'acked';
    }

    const insertResult = await options.gateway.insertPhoto({
      id: item.payload.photoId,
      treatmentId: item.payload.treatmentId,
      patientId: context.context.patientId,
      clinicId: context.context.clinicId,
      submittedOn: item.payload.submittedOn,
      slot: item.payload.slot,
      storagePath: path,
      contentType: item.payload.contentType,
    });

    if (insertResult === 'retry') {
      return 'retry';
    }

    if (insertResult === 'integrity') {
      return 'acked';
    }

    if (insertResult === 'conflict') {
      let existing;
      try {
        existing = await options.gateway.selectBySlot({
          treatmentId: item.payload.treatmentId,
          submittedOn: item.payload.submittedOn,
          slot: item.payload.slot,
        });
      } catch {
        return 'retry';
      }

      if (existing === null || existing.id !== item.payload.photoId) {
        return 'acked';
      }
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await readFileBytes(
        options.fileOps.fileUri(item.payload.treatmentId, item.payload.localFileRef),
      );
    } catch {
      return 'retry';
    }

    const uploadResult = await options.gateway.uploadObject({
      path,
      bytes,
      contentType: item.payload.contentType,
    });

    if (uploadResult === 'retry') {
      return 'retry';
    }

    if (uploadResult === 'integrity') {
      return 'acked';
    }

    const cohort = context.context.pilotCohort;
    if (cohort === null) {
      return 'retry';
    }

    try {
      await options.eventSink.append({
        name: 'patient_photo_added',
        at: now().toISOString(),
        pilotCohort: cohort,
        patientId: context.context.patientId,
        treatmentId: item.payload.treatmentId,
        entityId: item.payload.photoId,
      });
    } catch {
      return 'retry';
    }

    return 'acked';
  }

  async function removeAckedFiles(
    authUserId: string,
    before: readonly WriteOutboxItem<PatientPhotoOutboxPayload>[],
  ): Promise<void> {
    const after = await options.outboxStore.load();
    const remaining = new Set(after.map((item) => item.id));

    for (const item of before) {
      if (item.authUserId !== authUserId || remaining.has(item.id)) {
        continue;
      }

      await options.fileOps.remove(item.payload.treatmentId, item.payload.localFileRef);
    }
  }

  async function flushCurrentUser(): Promise<void> {
    const authUserId = options.readAuthUserId();
    const before = await options.outboxStore.load();
    await outbox.flush(authUserId);
    if (authUserId !== null) {
      await removeAckedFiles(authUserId, before);
    }
  }

  function snapshotFor(authUserId: string, treatmentId: string): readonly PatientPhoto[] | null {
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

    return snapshot.photos;
  }

  async function present(
    authUserId: string,
    treatmentId: string,
    photos: readonly PatientPhoto[],
  ): Promise<readonly PatientPhoto[]> {
    const items = await options.outboxStore.load();
    return applyPatientPhotoOutbox(photos, items, authUserId, treatmentId);
  }

  async function fetchPhotos(
    authUserId: string,
    treatmentId: string,
  ): Promise<readonly PatientPhoto[]> {
    const rows = await options.gateway.listPhotos(treatmentId);
    const photos = rows
      .map(mapRemotePatientPhoto)
      .filter((photo): photo is PatientPhoto => photo !== null);
    snapshot = { authUserId, treatmentId, photos };
    return photos;
  }

  async function loadPresented(treatmentId: string): Promise<readonly PatientPhoto[]> {
    const authUserId = options.readAuthUserId();
    await flushCurrentUser();

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
      const fetched = await fetchPhotos(context.context.authUserId, treatmentId);
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
    async listPhotos(treatmentId) {
      return loadPresented(treatmentId);
    },
    async recordPhoto(
      treatment: Treatment,
      onDate: CalendarDate,
      captured: CapturedImage,
    ): Promise<RecordCapturedPatientPhotoResult> {
      if (!isActiveTreatment(treatment)) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      const existingPhotos = await loadPresented(treatment.id);
      const slot = nextPatientPhotoSlot(existingPhotos, onDate);
      if (slot === null) {
        return { status: 'ignored', reason: 'daily_cap_reached' };
      }

      const extension = resolveSourceExtension(captured);
      const contentType = extension === null ? null : contentTypeForExtension(extension);
      if (extension === null || contentType === null) {
        return { status: 'ignored', reason: 'invalid_source' };
      }

      const size = await options.fileOps.getSize(captured.sourceUri);
      if (size !== null && size > PATIENT_PHOTO_MAX_BYTES) {
        return { status: 'ignored', reason: 'file_too_large' };
      }

      const photo = createPatientPhoto({
        id: createId(),
        treatmentId: treatment.id,
        patientId: treatment.patientId,
        submittedOn: onDate,
        slot,
      });
      const localFileRef = patientPhotoFileRef(photo.id, extension);

      const domainResult = recordPatientPhoto({
        treatment,
        existingPhotos,
        onDate,
        photo,
      });
      if (domainResult.status === 'ignored') {
        return domainResult;
      }

      const authUserId = options.readAuthUserId();
      if (authUserId === null) {
        throw new RetryableRemoteError('unauthenticated photo upload');
      }

      await options.fileOps.copy(captured.sourceUri, treatment.id, localFileRef);

      try {
        await outbox.enqueue({
          id: nextOutboxItemId(),
          authUserId,
          treatmentId: treatment.id,
          createdAt: now().toISOString(),
          payload: {
            photoId: photo.id,
            treatmentId: treatment.id,
            patientId: treatment.patientId,
            submittedOn: formatCivilDate(onDate),
            slot,
            contentType,
            extension,
            localFileRef,
          },
        });
      } catch (error) {
        await options.fileOps.remove(treatment.id, localFileRef);
        throw error;
      }

      snapshot = {
        authUserId,
        treatmentId: treatment.id,
        photos: domainResult.photos.map(copyPhoto),
      };

      await flushCurrentUser();

      const remaining = await options.outboxStore.load();
      const stillPending = remaining.some(
        (item) => item.authUserId === authUserId && item.payload.photoId === photo.id,
      );

      if (stillPending) {
        return { status: 'queued', photo: copyPhoto(photo) };
      }

      return {
        status: 'recorded',
        photo: copyPhoto(photo),
        analyticsHandled: true,
      };
    },
  };
}
