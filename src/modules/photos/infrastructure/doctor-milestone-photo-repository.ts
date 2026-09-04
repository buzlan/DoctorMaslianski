import type { DoctorMilestonePhoto } from '../domain';

/**
 * Read-only patient-app port for doctor-uploaded visit photos.
 *
 * Clinic writes land in TASK-034. Remote URI resolution lands in TASK-032.
 * resolveDisplayUri is async so a later private-storage adapter can mint
 * temporary display URLs without changing this contract.
 */
export type DoctorMilestonePhotoRepository = {
  listPhotos(treatmentId: string): Promise<readonly DoctorMilestonePhoto[]>;
  resolveDisplayUri(photo: DoctorMilestonePhoto): Promise<string | null>;
};
