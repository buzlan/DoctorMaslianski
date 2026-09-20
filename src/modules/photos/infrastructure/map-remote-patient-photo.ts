import type { WriteOutboxItem } from '@/core/sync/write-outbox';
import { parseCivilDate } from '@/shared/date/civil-date';

import { createPatientPhoto, type PatientPhoto, type PatientPhotoSlot } from '../domain';

export type RemotePatientPhotoRow = {
  id: string;
  treatment_id: string;
  patient_id: string;
  submitted_on: string;
  slot: number;
};

export type PatientPhotoOutboxPayload = {
  photoId: string;
  treatmentId: string;
  patientId: string;
  submittedOn: string;
  slot: PatientPhotoSlot;
  contentType: string;
  extension: string;
  localFileRef: string;
};

function parseSlot(value: number): PatientPhotoSlot | null {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  return null;
}

export function mapRemotePatientPhoto(row: RemotePatientPhotoRow): PatientPhoto | null {
  const submittedOn = parseCivilDate(row.submitted_on);
  const slot = parseSlot(row.slot);
  if (submittedOn === null || slot === null) {
    return null;
  }

  try {
    return createPatientPhoto({
      id: row.id,
      treatmentId: row.treatment_id,
      patientId: row.patient_id,
      submittedOn,
      slot,
    });
  } catch {
    return null;
  }
}

export function applyPatientPhotoOutbox(
  photos: readonly PatientPhoto[],
  items: readonly WriteOutboxItem<PatientPhotoOutboxPayload>[],
  authUserId: string,
  treatmentId: string,
): PatientPhoto[] {
  const next = [...photos];

  for (const item of items) {
    if (item.authUserId !== authUserId || item.treatmentId !== treatmentId) {
      continue;
    }

    if (next.some((photo) => photo.id === item.payload.photoId)) {
      continue;
    }

    const mapped = mapRemotePatientPhoto({
      id: item.payload.photoId,
      treatment_id: item.payload.treatmentId,
      patient_id: item.payload.patientId,
      submitted_on: item.payload.submittedOn,
      slot: item.payload.slot,
    });
    if (mapped !== null) {
      next.push(mapped);
    }
  }

  return next;
}
