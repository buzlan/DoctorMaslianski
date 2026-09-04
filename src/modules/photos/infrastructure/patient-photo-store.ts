import type { PatientPhoto } from '../domain';

/**
 * Local-at-rest metadata for fixture PatientPhoto rows (__DEV__ without auth).
 *
 * Separate from CompletionOverlayStore and diary SecureStore. Do not store
 * image bytes here. Authenticated runtime uses remote `patient_photos` plus a
 * pending-upload outbox; this filesystem index is not canonical history.
 */
export type StoredPatientPhoto = PatientPhoto & {
  localFileRef: string;
};

export type PatientPhotoStore = {
  load(treatmentId: string): Promise<readonly StoredPatientPhoto[]>;
  save(treatmentId: string, photos: readonly StoredPatientPhoto[]): Promise<void>;
};
