import { isSameCalendarDate, type CalendarDate } from '@/modules/treatment/domain';

import type { PatientPhoto, PatientPhotoSlot } from './types';
import { MAX_PATIENT_PHOTOS_PER_CIVIL_DATE } from './types';

export function getPatientPhotosOnDate(
  photos: readonly PatientPhoto[],
  onDate: CalendarDate,
): readonly PatientPhoto[] {
  return photos.filter((photo) => isSameCalendarDate(photo.submittedOn, onDate));
}

export function countPatientPhotosOnDate(
  photos: readonly PatientPhoto[],
  onDate: CalendarDate,
): number {
  return getPatientPhotosOnDate(photos, onDate).length;
}

export function nextPatientPhotoSlot(
  photos: readonly PatientPhoto[],
  onDate: CalendarDate,
): PatientPhotoSlot | null {
  const count = countPatientPhotosOnDate(photos, onDate);
  if (count >= MAX_PATIENT_PHOTOS_PER_CIVIL_DATE) {
    return null;
  }
  return (count + 1) as PatientPhotoSlot;
}

export function canAddPatientPhotoOnDate(
  photos: readonly PatientPhoto[],
  onDate: CalendarDate,
): boolean {
  return nextPatientPhotoSlot(photos, onDate) !== null;
}
