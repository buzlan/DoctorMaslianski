import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import type { PatientPhoto, PatientPhotoSlot } from './types';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);

export class InvalidPatientPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPatientPhotoError';
  }
}

export type CreatePatientPhotoInput = {
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  slot: PatientPhotoSlot;
  localFileRef: string;
};

export function patientPhotoIdFor(
  treatmentId: string,
  onDate: CalendarDate,
  slot: PatientPhotoSlot,
): string {
  return `${treatmentId}:${onDate.year}-${onDate.month}-${onDate.day}:${slot}`;
}

export function createPatientPhoto(input: CreatePatientPhotoInput): PatientPhoto {
  if (typeof input.treatmentId !== 'string' || input.treatmentId.length === 0) {
    throw new InvalidPatientPhotoError('invalid field: treatmentId');
  }

  if (typeof input.patientId !== 'string' || input.patientId.length === 0) {
    throw new InvalidPatientPhotoError('invalid field: patientId');
  }

  if (input.slot !== 1 && input.slot !== 2 && input.slot !== 3) {
    throw new InvalidPatientPhotoError('invalid field: slot');
  }

  const submittedOn = calendarDate(
    input.submittedOn.year,
    input.submittedOn.month,
    input.submittedOn.day,
  );

  return {
    id: patientPhotoIdFor(input.treatmentId, submittedOn, input.slot),
    treatmentId: input.treatmentId,
    patientId: input.patientId,
    submittedOn,
    localFileRef: parseLocalFileRef(input.localFileRef),
  };
}

function parseLocalFileRef(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidPatientPhotoError('invalid field: localFileRef');
  }

  if (value.includes('://') || value.includes('..') || value.startsWith('/') || value.includes('\\')) {
    throw new InvalidPatientPhotoError('invalid field: localFileRef');
  }

  const extension = value.split('.').pop()?.toLowerCase();
  if (extension === undefined || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new InvalidPatientPhotoError('invalid field: localFileRef');
  }

  return value;
}
