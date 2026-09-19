import type { DoctorMilestonePhoto } from '../domain';

import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';

export type InMemoryDoctorMilestonePhotoSeed = {
  photos?: readonly DoctorMilestonePhoto[];
  displayUris?: Readonly<Record<string, string>>;
};

function copyPhoto(photo: DoctorMilestonePhoto): DoctorMilestonePhoto {
  return {
    id: photo.id,
    treatmentId: photo.treatmentId,
    milestoneId: photo.milestoneId,
    storageRef: photo.storageRef,
  };
}

export function createInMemoryDoctorMilestonePhotoRepository(
  seed: InMemoryDoctorMilestonePhotoSeed = {},
): DoctorMilestonePhotoRepository {
  const photos = (seed.photos ?? []).map(copyPhoto);
  const displayUris = seed.displayUris ?? {};

  return {
    listPhotos(treatmentId) {
      return Promise.resolve(
        photos.filter((photo) => photo.treatmentId === treatmentId).map(copyPhoto),
      );
    },
    resolveDisplayUri(photo) {
      const displayUri = displayUris[photo.id];
      if (displayUri === undefined || displayUri.length === 0) {
        return Promise.resolve(null);
      }

      return Promise.resolve(displayUri);
    },
  };
}
