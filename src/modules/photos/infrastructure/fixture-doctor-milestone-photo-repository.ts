import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';

/**
 * Empty development fixture for DoctorMilestonePhoto.
 *
 * This is not clinic-authored data. Unauthenticated __DEV__ has no doctor
 * photos to display. Authenticated runtime reads `doctor_milestone_photos`
 * and mints short-lived signed URLs. Do not seed invented visit images here.
 *
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
