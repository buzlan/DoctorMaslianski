import { isSameCalendarDate, type CalendarDate } from '@/modules/treatment/domain';

import type { PatientPhoto, PatientPhotoSlot } from './types';

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
  const occupied = new Set(
    getPatientPhotosOnDate(photos, onDate).map((photo) => photo.slot),
  );

  for (const slot of [1, 2, 3] as const) {
    if (!occupied.has(slot)) {
      return slot;
    }
  }

  return null;
}

export function canAddPatientPhotoOnDate(
  photos: readonly PatientPhoto[],
  onDate: CalendarDate,
): boolean {
  return nextPatientPhotoSlot(photos, onDate) !== null;
}
