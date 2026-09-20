import { isActiveTreatment, type CalendarDate, type Treatment } from '@/modules/treatment/domain';

import { countPatientPhotosOnDate } from './helpers';
import type { PatientPhoto } from './types';
import { MAX_PATIENT_PHOTOS_PER_CIVIL_DATE } from './types';

export type RecordPatientPhotoResult =
  | {
      status: 'recorded';
      photo: PatientPhoto;
      photos: readonly PatientPhoto[];
    }
  | {
      status: 'ignored';
      reason: 'no_active_treatment' | 'daily_cap_reached';
    };

export function recordPatientPhoto(input: {
  treatment: Treatment;
  existingPhotos: readonly PatientPhoto[];
  onDate: CalendarDate;
  photo: PatientPhoto;
}): RecordPatientPhotoResult {
  if (!isActiveTreatment(input.treatment)) {
    return { status: 'ignored', reason: 'no_active_treatment' };
  }

  if (countPatientPhotosOnDate(input.existingPhotos, input.onDate) >= MAX_PATIENT_PHOTOS_PER_CIVIL_DATE) {
    return { status: 'ignored', reason: 'daily_cap_reached' };
  }

  return {
    status: 'recorded',
    photo: input.photo,
    photos: [...input.existingPhotos, input.photo],
  };
}
