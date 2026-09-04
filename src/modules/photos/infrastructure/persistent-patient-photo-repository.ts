/**
 * Persistent PatientPhotoRepository for unauthenticated __DEV__ fixtures.
 *
 * Domain writes go through recordPatientPhoto. Image copy happens only after
 * the daily cap check. Authenticated runtime uses the remote repository.
 */

import { isActiveTreatment, type CalendarDate, type Treatment } from '@/modules/treatment/domain';
import { createRandomUuid } from '@/shared/id/random-uuid';

import {
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
import { copyPhoto, copyStoredPhoto } from './patient-photo-store-codec';
import type {
  PatientPhotoRepository,
  RecordCapturedPatientPhotoResult,
} from './patient-photo-repository';
import type { PatientPhotoStore, StoredPatientPhoto } from './patient-photo-store';

export type PersistentPatientPhotoRepositoryOptions = {
  store: PatientPhotoStore;
  fileOps: PatientPhotoFileOps;
  createId?: () => string;
};

class PersistentPatientPhotoRepository implements PatientPhotoRepository {
  private readonly store: PatientPhotoStore;
  private readonly fileOps: PatientPhotoFileOps;
  private readonly createId: () => string;
  private readonly byTreatment = new Map<string, StoredPatientPhoto[]>();
  private readonly hydrated = new Set<string>();
  private queue: Promise<void> = Promise.resolve();

  constructor(options: PersistentPatientPhotoRepositoryOptions) {
    this.store = options.store;
    this.fileOps = options.fileOps;
    this.createId = options.createId ?? createRandomUuid;
  }

  listPhotos(treatmentId: string): Promise<readonly PatientPhoto[]> {
    return this.enqueue(async () => {
      await this.hydrate(treatmentId);
      return (this.byTreatment.get(treatmentId) ?? []).map(copyPhoto);
    });
  }

  recordPhoto(
    treatment: Treatment,
    onDate: CalendarDate,
    captured: CapturedImage,
  ): Promise<RecordCapturedPatientPhotoResult> {
    return this.enqueue(async () => {
      if (!isActiveTreatment(treatment)) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      await this.hydrate(treatment.id);
      const existingStored = this.byTreatment.get(treatment.id) ?? [];
      const existingPhotos = existingStored.map(copyPhoto);
      const slot = nextPatientPhotoSlot(existingPhotos, onDate);
      if (slot === null) {
        return { status: 'ignored', reason: 'daily_cap_reached' };
      }

      const extension = resolveSourceExtension(captured);
      if (extension === null) {
        return { status: 'ignored', reason: 'invalid_source' };
      }

      const size = await this.fileOps.getSize(captured.sourceUri);
      if (size !== null && size > PATIENT_PHOTO_MAX_BYTES) {
        return { status: 'ignored', reason: 'file_too_large' };
      }

      const photo = createPatientPhoto({
        id: this.createId(),
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

      await this.fileOps.copy(captured.sourceUri, treatment.id, localFileRef);

      const stored = domainResult.photos.map((item) => {
        const previous = existingStored.find((row) => row.id === item.id);
        if (previous !== undefined) {
          return copyStoredPhoto(previous);
        }
        return copyStoredPhoto({ ...item, localFileRef });
      });

      try {
        await this.store.save(treatment.id, stored);
      } catch (error) {
        await this.fileOps.remove(treatment.id, localFileRef);
        throw error;
      }

      this.byTreatment.set(treatment.id, stored.map(copyStoredPhoto));
      return {
        status: 'recorded',
        photo: copyPhoto(photo),
      };
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async hydrate(treatmentId: string): Promise<void> {
    if (this.hydrated.has(treatmentId)) {
      return;
    }

    let stored: readonly StoredPatientPhoto[] = [];
    try {
      stored = await this.store.load(treatmentId);
    } catch {
      stored = [];
    }

    this.byTreatment.set(treatmentId, stored.map(copyStoredPhoto));
    this.hydrated.add(treatmentId);
  }
}

export function createPersistentPatientPhotoRepository(
  options: PersistentPatientPhotoRepositoryOptions,
): PatientPhotoRepository {
  return new PersistentPatientPhotoRepository(options);
}

export function createInMemoryPatientPhotoRepository(): PatientPhotoRepository {
  return createPersistentPatientPhotoRepository({
    store: createLazyInMemoryStore(),
    fileOps: {
      copy() {
        return Promise.resolve();
      },
      remove() {
        return Promise.resolve();
      },
      getSize() {
        return Promise.resolve(1024);
      },
      fileUri(treatmentId, localFileRef) {
        return `memory://${treatmentId}/${localFileRef}`;
      },
    },
  });
}

function createLazyInMemoryStore(): PatientPhotoStore {
  const byTreatment = new Map<string, StoredPatientPhoto[]>();
  return {
    load(treatmentId) {
      return Promise.resolve((byTreatment.get(treatmentId) ?? []).map(copyStoredPhoto));
    },
    save(treatmentId, photos) {
      byTreatment.set(treatmentId, photos.map(copyStoredPhoto));
      return Promise.resolve();
    },
  };
}
