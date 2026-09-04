import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';

/**
 * Empty development fixture for DoctorMilestonePhoto.
 *
 * This is not clinic-authored data. The clinic dashboard (TASK-034) and
 * remote storage (TASK-032) do not exist yet, so the shared runtime has no
 * doctor photos to display. Do not seed invented visit images here.
 *
 * Temporary until a remote read adapter replaces this singleton.
 * Do not store doctor-photo bytes in AsyncStorage or SecureStore.
 */
export function createFixtureDoctorMilestonePhotoRepository(): DoctorMilestonePhotoRepository {
  return {
    listPhotos() {
      return Promise.resolve([]);
    },
    resolveDisplayUri() {
      return Promise.resolve(null);
    },
  };
}
