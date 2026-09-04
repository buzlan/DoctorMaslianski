/**
 * Filesystem metadata store for PatientPhoto rows.
 *
 * Image bytes are copied separately via PatientPhotoFileOps. This store writes
 * only an index JSON (ids, civil dates, localFileRef).
 *
 * Temporary development / internal dry-run restart mechanism. Not the final
 * real-patient photo architecture. TASK-032 and privacy/security review remain
 * required before real-patient rollout. Do not store bytes in AsyncStorage or
 * SecureStore.
 */

import * as FileSystem from 'expo-file-system/legacy';

import type { PatientPhoto } from '../domain';

import { patientPhotoDirectoryUri } from './expo-patient-photo-file-ops';
import {
  parsePatientPhotoIndex,
  serializePatientPhotoIndex,
} from './patient-photo-store-codec';
import type { PatientPhotoStore } from './patient-photo-store';

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
    async save(treatmentId, photos: readonly PatientPhoto[]) {
      const directory = patientPhotoDirectoryUri(treatmentId);
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      await FileSystem.writeAsStringAsync(
        indexUri(treatmentId),
        serializePatientPhotoIndex(treatmentId, photos),
      );
    },
  };
}
