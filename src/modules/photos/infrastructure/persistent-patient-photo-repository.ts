/**
 * Persistent PatientPhotoRepository.
 *
 * Domain writes go through recordPatientPhoto. Image copy happens only after
 * the daily cap check. Metadata persistence is a separate local-at-rest
 * adapter and must not reuse the assignment completion overlay or diary store.
 *
 * Local filesystem storage is a temporary development / internal dry-run
 * restart mechanism. Real-patient photo handling still requires TASK-032
 * plus privacy/security review.
 */

import { isActiveTreatment, type CalendarDate, type Treatment } from '@/modules/treatment/domain';

import {
  createPatientPhoto,
  nextPatientPhotoSlot,
  patientPhotoFileRef,
  patientPhotoIdFor,
  recordPatientPhoto,
  resolveSourceExtension,
  type CapturedImage,
  type PatientPhoto,
} from '../domain';

import type { PatientPhotoFileOps } from './patient-photo-file-ops';
import { copyPhoto } from './patient-photo-store-codec';
import type {
  PatientPhotoRepository,
  RecordCapturedPatientPhotoResult,
} from './patient-photo-repository';
import type { PatientPhotoStore } from './patient-photo-store';

export type PersistentPatientPhotoRepositoryOptions = {
  store: PatientPhotoStore;
  fileOps: PatientPhotoFileOps;
};

class PersistentPatientPhotoRepository implements PatientPhotoRepository {
  private readonly store: PatientPhotoStore;
  private readonly fileOps: PatientPhotoFileOps;
  private readonly byTreatment = new Map<string, PatientPhoto[]>();
  private readonly hydrated = new Set<string>();
  private queue: Promise<void> = Promise.resolve();

  constructor(options: PersistentPatientPhotoRepositoryOptions) {
    this.store = options.store;
    this.fileOps = options.fileOps;
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
      const existingPhotos = this.byTreatment.get(treatment.id) ?? [];
      const slot = nextPatientPhotoSlot(existingPhotos, onDate);
      if (slot === null) {
        return { status: 'ignored', reason: 'daily_cap_reached' };
      }

      const extension = resolveSourceExtension(captured);
      if (extension === null) {
        return { status: 'ignored', reason: 'invalid_source' };
      }

      const photo = createPatientPhoto({
        treatmentId: treatment.id,
        patientId: treatment.patientId,
        submittedOn: onDate,
        slot,
        localFileRef: patientPhotoFileRef(patientPhotoIdFor(treatment.id, onDate, slot), extension),
      });

      const domainResult = recordPatientPhoto({
        treatment,
        existingPhotos,
        onDate,
        photo,
      });

      if (domainResult.status === 'ignored') {
        return domainResult;
      }

      await this.fileOps.copy(captured.sourceUri, treatment.id, photo.localFileRef);

      try {
        await this.store.save(treatment.id, domainResult.photos);
      } catch (error) {
        await this.fileOps.remove(treatment.id, photo.localFileRef);
        throw error;
      }

      this.byTreatment.set(treatment.id, domainResult.photos.map(copyPhoto));
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

    let stored: readonly PatientPhoto[] = [];
    try {
      stored = await this.store.load(treatmentId);
    } catch {
      stored = [];
    }

    this.byTreatment.set(treatmentId, stored.map(copyPhoto));
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
    },
  });
}

function createLazyInMemoryStore(): PatientPhotoStore {
  const byTreatment = new Map<string, PatientPhoto[]>();
  return {
    load(treatmentId) {
      return Promise.resolve((byTreatment.get(treatmentId) ?? []).map(copyPhoto));
    },
    save(treatmentId, photos) {
      byTreatment.set(treatmentId, photos.map(copyPhoto));
      return Promise.resolve();
    },
  };
}
