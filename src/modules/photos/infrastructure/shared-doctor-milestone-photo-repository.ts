import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';
import { createFixtureDoctorMilestonePhotoRepository } from './fixture-doctor-milestone-photo-repository';

const localDoctorMilestonePhotoRepository =
  createFixtureDoctorMilestonePhotoRepository();

function activeDoctorMilestonePhotoRepository(): DoctorMilestonePhotoRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.doctorPhotos;
    }
  }

  return localDoctorMilestonePhotoRepository;
}

export const sharedDoctorMilestonePhotoRepository: DoctorMilestonePhotoRepository =
  {
    listPhotos(treatmentId) {
      return activeDoctorMilestonePhotoRepository().listPhotos(treatmentId);
    },
    resolveDisplayUri(photo) {
      return activeDoctorMilestonePhotoRepository().resolveDisplayUri(photo);
    },
  };
