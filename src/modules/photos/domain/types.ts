import type { CalendarDate } from '@/modules/treatment/domain';

export const MAX_PATIENT_PHOTOS_PER_CIVIL_DATE = 3;

export type PatientPhotoSlot = 1 | 2 | 3;

export type PatientPhoto = {
  id: string;
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  localFileRef: string;
};
