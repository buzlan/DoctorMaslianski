export { MAX_PATIENT_PHOTOS_PER_CIVIL_DATE } from './types';
export type { PatientPhoto, PatientPhotoSlot } from './types';

export {
  createPatientPhoto,
  InvalidPatientPhotoError,
  patientPhotoIdFor,
} from './create-patient-photo';
export type { CreatePatientPhotoInput } from './create-patient-photo';

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
