import type { DoctorMilestonePhoto } from '../domain';

/**
 * Read-only patient-app port for doctor-uploaded visit photos.
 *
 * Clinic writes land in TASK-034. resolveDisplayUri mints a short-lived
 * signed URL from private storage and must not persist that URL.
 */
export type DoctorMilestonePhotoRepository = {
  listPhotos(treatmentId: string): Promise<readonly DoctorMilestonePhoto[]>;
  resolveDisplayUri(photo: DoctorMilestonePhoto): Promise<string | null>;
};
