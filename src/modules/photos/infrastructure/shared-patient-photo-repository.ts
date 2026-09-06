import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import { createFileSystemPatientPhotoStore } from './file-system-patient-photo-store';
import { createExpoPatientPhotoFileOps } from './expo-patient-photo-file-ops';
import { createPersistentPatientPhotoRepository } from './persistent-patient-photo-repository';
import type { PatientPhotoRepository } from './patient-photo-repository';

const localPatientPhotoRepository = createPersistentPatientPhotoRepository({
  store: createFileSystemPatientPhotoStore(),
  fileOps: createExpoPatientPhotoFileOps(),
});

function activePatientPhotoRepository(): PatientPhotoRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.patientPhotos;
    }
  }

  return localPatientPhotoRepository;
}

export const sharedPatientPhotoRepository: PatientPhotoRepository = {
  listPhotos(treatmentId) {
    return activePatientPhotoRepository().listPhotos(treatmentId);
  },
  recordPhoto(treatment, onDate, captured) {
    return activePatientPhotoRepository().recordPhoto(treatment, onDate, captured);
  },
};
