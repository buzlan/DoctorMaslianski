/**
 * Filesystem metadata store for fixture PatientPhoto rows.
 *
 * Image bytes are copied separately via PatientPhotoFileOps. This store writes
 * only an index JSON (ids, civil dates, slot, localFileRef).
 *
 * Unauthenticated __DEV__ restart mechanism. Authenticated runtime does not
 * treat this index as canonical photo history. Do not store bytes in
 * AsyncStorage or SecureStore.
 */

import * as FileSystem from 'expo-file-system/legacy';

import { patientPhotoDirectoryUri } from './expo-patient-photo-file-ops';
import {
  parsePatientPhotoIndex,
  serializePatientPhotoIndex,
} from './patient-photo-store-codec';
import type { PatientPhotoStore, StoredPatientPhoto } from './patient-photo-store';

function indexUri(treatmentId: string): string {
  return `${patientPhotoDirectoryUri(treatmentId)}index.json`;
}

export function createFileSystemPatientPhotoStore(): PatientPhotoStore {
  return {
    async load(treatmentId) {
      try {
        const raw = await FileSystem.readAsStringAsync(indexUri(treatmentId));
        return parsePatientPhotoIndex(raw, treatmentId);
      } catch {
        return [];
      }
    },
    async save(treatmentId, photos: readonly StoredPatientPhoto[]) {
      const directory = patientPhotoDirectoryUri(treatmentId);
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      await FileSystem.writeAsStringAsync(
        indexUri(treatmentId),
        serializePatientPhotoIndex(treatmentId, photos),
      );
    },
  };
}
