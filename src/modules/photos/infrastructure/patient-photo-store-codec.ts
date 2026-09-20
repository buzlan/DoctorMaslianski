import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import { createPatientPhoto, InvalidPatientPhotoError, type PatientPhoto } from '../domain';

import type { StoredPatientPhoto } from './patient-photo-store';

export const PATIENT_PHOTO_STORE_VERSION = 2;

type PatientPhotoIndexEnvelope = {
  version: typeof PATIENT_PHOTO_STORE_VERSION;
  treatmentId: string;
  photos: readonly unknown[];
};

export function copyPhoto(photo: PatientPhoto): PatientPhoto {
  return {
    id: photo.id,
    treatmentId: photo.treatmentId,
    patientId: photo.patientId,
    submittedOn: {
      year: photo.submittedOn.year,
      month: photo.submittedOn.month,
      day: photo.submittedOn.day,
    },
    slot: photo.slot,
  };
}

export function copyStoredPhoto(photo: StoredPatientPhoto): StoredPatientPhoto {
  return {
    ...copyPhoto(photo),
    localFileRef: photo.localFileRef,
  };
}

function parsePhoto(value: unknown, treatmentId: string): StoredPatientPhoto | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const submittedOn = record.submittedOn;
  if (submittedOn === null || typeof submittedOn !== 'object' || Array.isArray(submittedOn)) {
    return null;
  }
  const dateRecord = submittedOn as Record<string, unknown>;

  try {
    const onDate: CalendarDate = calendarDate(
      Number(dateRecord.year),
      Number(dateRecord.month),
      Number(dateRecord.day),
    );
    const slot = Number(record.slot);
    if (slot !== 1 && slot !== 2 && slot !== 3) {
      return null;
    }

    const localFileRef = record.localFileRef;
    if (typeof localFileRef !== 'string' || localFileRef.length === 0) {
      return null;
    }

    const photo = createPatientPhoto({
      id: String(record.id ?? ''),
      treatmentId,
      patientId: String(record.patientId ?? ''),
      submittedOn: onDate,
      slot,
    });

    return copyStoredPhoto({ ...photo, localFileRef });
  } catch (error) {
    if (error instanceof InvalidPatientPhotoError) {
      return null;
    }
    return null;
  }
}

export function serializePatientPhotoIndex(
  treatmentId: string,
  photos: readonly StoredPatientPhoto[],
): string {
  const envelope: PatientPhotoIndexEnvelope = {
    version: PATIENT_PHOTO_STORE_VERSION,
    treatmentId,
    photos: photos.map(copyStoredPhoto),
  };
  return JSON.stringify(envelope);
}

export function parsePatientPhotoIndex(
  raw: string | null,
  treatmentId: string,
): readonly StoredPatientPhoto[] {
  if (raw === null || raw === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }

  const record = parsed as Record<string, unknown>;
  if (record.version !== PATIENT_PHOTO_STORE_VERSION || record.treatmentId !== treatmentId) {
    return [];
  }

  if (!Array.isArray(record.photos)) {
    return [];
  }

  const photos: StoredPatientPhoto[] = [];
  for (const item of record.photos) {
    const photo = parsePhoto(item, treatmentId);
    if (photo !== null) {
      photos.push(photo);
    }
  }
  return photos;
}
