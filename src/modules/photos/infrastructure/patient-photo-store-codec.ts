import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import { createPatientPhoto, InvalidPatientPhotoError, type PatientPhoto } from '../domain';

export const PATIENT_PHOTO_STORE_VERSION = 1;

type PatientPhotoIndexEnvelope = {
  version: typeof PATIENT_PHOTO_STORE_VERSION;
  treatmentId: string;
  photos: readonly unknown[];
};

function copyPhoto(photo: PatientPhoto): PatientPhoto {
  return {
    id: photo.id,
    treatmentId: photo.treatmentId,
    patientId: photo.patientId,
    submittedOn: {
      year: photo.submittedOn.year,
      month: photo.submittedOn.month,
      day: photo.submittedOn.day,
    },
    localFileRef: photo.localFileRef,
  };
}

function parsePhoto(value: unknown, treatmentId: string): PatientPhoto | null {
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
    const slot = Number(String(record.id).split(':').pop());
    if (slot !== 1 && slot !== 2 && slot !== 3) {
      return null;
    }

    const photo = createPatientPhoto({
      treatmentId,
      patientId: String(record.patientId ?? ''),
      submittedOn: onDate,
      slot,
      localFileRef: String(record.localFileRef ?? ''),
    });

    if (photo.id !== record.id) {
      return null;
    }

    return copyPhoto(photo);
  } catch (error) {
    if (error instanceof InvalidPatientPhotoError) {
      return null;
    }
    return null;
  }
}

export function serializePatientPhotoIndex(
  treatmentId: string,
  photos: readonly PatientPhoto[],
): string {
  const envelope: PatientPhotoIndexEnvelope = {
    version: PATIENT_PHOTO_STORE_VERSION,
    treatmentId,
    photos: photos.map(copyPhoto),
  };
  return JSON.stringify(envelope);
}

export function parsePatientPhotoIndex(
  raw: string | null,
  treatmentId: string,
): readonly PatientPhoto[] {
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

  const photos: PatientPhoto[] = [];
  for (const item of record.photos) {
    const photo = parsePhoto(item, treatmentId);
    if (photo !== null) {
      photos.push(photo);
    }
  }
  return photos;
}

export { copyPhoto };
