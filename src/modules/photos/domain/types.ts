import type { CalendarDate } from '@/modules/treatment/domain';

export const MAX_PATIENT_PHOTOS_PER_CIVIL_DATE = 3;

export const PATIENT_PHOTO_MAX_BYTES = 15_728_640;

export type PatientPhotoSlot = 1 | 2 | 3;

export type PatientPhoto = {
  id: string;
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  slot: PatientPhotoSlot;
};
