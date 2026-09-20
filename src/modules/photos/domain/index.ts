export {
  MAX_PATIENT_PHOTOS_PER_CIVIL_DATE,
  PATIENT_PHOTO_MAX_BYTES,
} from './types';
export type { PatientPhoto, PatientPhotoSlot } from './types';

export {
  createPatientPhoto,
  InvalidPatientPhotoError,
} from './create-patient-photo';
export type { CreatePatientPhotoInput } from './create-patient-photo';

export { contentTypeForExtension } from './patient-photo-content-type';

export {
  createDoctorMilestonePhoto,
  InvalidDoctorMilestonePhotoError,
} from './create-doctor-milestone-photo';
export type {
  CreateDoctorMilestonePhotoInput,
  DoctorMilestonePhoto,
} from './create-doctor-milestone-photo';

export { doctorPhotosForMilestone } from './doctor-milestone-photo-helpers';

export {
  canAddPatientPhotoOnDate,
  countPatientPhotosOnDate,
  getPatientPhotosOnDate,
  nextPatientPhotoSlot,
} from './helpers';

export { recordPatientPhoto } from './record-patient-photo';
export type { RecordPatientPhotoResult } from './record-patient-photo';

export { patientPhotoFileRef } from './photo-file-ref';

export { resolveSourceExtension } from './source-extension';
export type { CapturedImage } from './source-extension';
