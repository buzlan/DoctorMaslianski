import { createFileSystemPatientPhotoStore } from './file-system-patient-photo-store';
import { createExpoPatientPhotoFileOps } from './expo-patient-photo-file-ops';
import { createPersistentPatientPhotoRepository } from './persistent-patient-photo-repository';

export const sharedPatientPhotoRepository = createPersistentPatientPhotoRepository({
  store: createFileSystemPatientPhotoStore(),
  fileOps: createExpoPatientPhotoFileOps(),
});
