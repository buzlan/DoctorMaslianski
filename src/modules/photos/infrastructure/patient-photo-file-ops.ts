/**
 * Byte-copy boundary for confirmed PatientPhoto files.
 *
 * Not AsyncStorage. Not SecureStore. Image bytes stay on the local filesystem
 * (or an in-memory test double) only while a remote upload is pending, or in
 * the unauthenticated __DEV__ fixture store.
 */
export type PatientPhotoFileOps = {
  copy(sourceUri: string, treatmentId: string, localFileRef: string): Promise<void>;
  remove(treatmentId: string, localFileRef: string): Promise<void>;
  getSize(uri: string): Promise<number | null>;
  fileUri(treatmentId: string, localFileRef: string): string;
};
