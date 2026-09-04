import type { PatientPhoto } from '../domain';

/**
 * Local-at-rest metadata for PatientPhoto rows.
 *
 * Separate from CompletionOverlayStore and diary SecureStore. Do not store
 * image bytes here.
 *
 * The TASK-014 filesystem adapter is a temporary development / internal
 * dry-run restart mechanism. It is not the final storage architecture for
 * real-patient clinical photos. TASK-032 (Supabase Storage) and
 * privacy/security review remain required before real-patient rollout.
 */
export type PatientPhotoStore = {
  load(treatmentId: string): Promise<readonly PatientPhoto[]>;
  save(treatmentId: string, photos: readonly PatientPhoto[]): Promise<void>;
};
