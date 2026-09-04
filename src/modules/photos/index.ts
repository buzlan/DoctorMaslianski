export {
  canAddPatientPhotoOnDate,
  countPatientPhotosOnDate,
  createPatientPhoto,
  InvalidPatientPhotoError,
  MAX_PATIENT_PHOTOS_PER_CIVIL_DATE,
  patientPhotoIdFor,
  recordPatientPhoto,
} from './domain';
export type { CapturedImage, PatientPhoto, PatientPhotoSlot, RecordPatientPhotoResult } from './domain';
export {
  confirmPatientPhoto,
  createPatientPhotoLoader,
  sharedPatientPhotoLoader,
} from './application';
export type { PatientPhotoLoader, PhotoTodayState } from './application';
export {
  createInMemoryPatientPhotoRepository,
  createPersistentPatientPhotoRepository,
} from './infrastructure';
export type { PatientPhotoRepository } from './infrastructure';
export { PatientPhotoCaptureScreen } from './presentation';
