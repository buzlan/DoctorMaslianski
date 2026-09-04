import { calendarDate, type CalendarDate } from '@/modules/treatment/domain';

import type { PatientPhoto, PatientPhotoSlot } from './types';

export class InvalidPatientPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPatientPhotoError';
  }
}

export type CreatePatientPhotoInput = {
  id: string;
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  slot: PatientPhotoSlot;
};

export function createPatientPhoto(input: CreatePatientPhotoInput): PatientPhoto {
  if (typeof input.id !== 'string' || input.id.length === 0) {
    throw new InvalidPatientPhotoError('invalid field: id');
  }

  if (input.id.includes('://') || input.id.includes('..') || input.id.includes('/') || input.id.includes('\\')) {
    throw new InvalidPatientPhotoError('invalid field: id');
  }

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
    id: input.id,
    treatmentId: input.treatmentId,
    patientId: input.patientId,
    submittedOn,
    slot: input.slot,
  };
}
