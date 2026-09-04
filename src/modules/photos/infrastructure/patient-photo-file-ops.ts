/**
 * Byte-copy boundary for confirmed PatientPhoto files.
 *
 * Not AsyncStorage. Not SecureStore. Image bytes stay on the local filesystem
 * (or an in-memory test double) until TASK-032 remote upload.
 */
export type PatientPhotoFileOps = {
  copy(sourceUri: string, treatmentId: string, localFileRef: string): Promise<void>;
  remove(treatmentId: string, localFileRef: string): Promise<void>;
};
