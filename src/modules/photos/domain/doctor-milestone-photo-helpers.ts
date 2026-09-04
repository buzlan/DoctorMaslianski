import type { DoctorMilestonePhoto } from './create-doctor-milestone-photo';

export function doctorPhotosForMilestone(
  photos: readonly DoctorMilestonePhoto[],
  treatmentId: string,
  milestoneId: string,
): readonly DoctorMilestonePhoto[] {
  return photos.filter(
    (photo) => photo.treatmentId === treatmentId && photo.milestoneId === milestoneId,
  );
}
