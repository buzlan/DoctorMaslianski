export {
  canAddPatientPhotoOnDate,
  countPatientPhotosOnDate,
  createDoctorMilestonePhoto,
  createPatientPhoto,
  doctorPhotosForMilestone,
  InvalidDoctorMilestonePhotoError,
  InvalidPatientPhotoError,
  MAX_PATIENT_PHOTOS_PER_CIVIL_DATE,
  patientPhotoIdFor,
  recordPatientPhoto,
} from './domain';
export type {
  CapturedImage,
  CreateDoctorMilestonePhotoInput,
  DoctorMilestonePhoto,
  PatientPhoto,
  PatientPhotoSlot,
  RecordPatientPhotoResult,
} from './domain';
export {
  confirmPatientPhoto,
  createPatientPhotoLoader,
  sharedPatientPhotoLoader,
} from './application';
export type { PatientPhotoLoader, PhotoTodayState } from './application';
export {
  createInMemoryDoctorMilestonePhotoRepository,
  createInMemoryPatientPhotoRepository,
  createPersistentPatientPhotoRepository,
} from './infrastructure';
export type {
  DoctorMilestonePhotoRepository,
  PatientPhotoRepository,
} from './infrastructure';
export { PatientPhotoCaptureScreen } from './presentation';
