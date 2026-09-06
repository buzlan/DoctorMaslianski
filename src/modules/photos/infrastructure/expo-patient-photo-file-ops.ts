import * as FileSystem from 'expo-file-system/legacy';

import type { PatientPhotoFileOps } from './patient-photo-file-ops';

function sanitize(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '_');
}

function documentsRoot(): string {
  const base = FileSystem.documentDirectory;
  if (base === null || base.length === 0) {
    throw new Error('document directory unavailable');
  }
  return `${base}patient-photos/`;
}

export function patientPhotoDirectoryUri(treatmentId: string): string {
  return `${documentsRoot()}${sanitize(treatmentId)}/`;
}

export function patientPhotoFileUri(treatmentId: string, localFileRef: string): string {
  return `${patientPhotoDirectoryUri(treatmentId)}${localFileRef}`;
}

export function createExpoPatientPhotoFileOps(): PatientPhotoFileOps {
  return {
    async copy(sourceUri, treatmentId, localFileRef) {
      const directory = patientPhotoDirectoryUri(treatmentId);
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      await FileSystem.copyAsync({
        from: sourceUri,
        to: patientPhotoFileUri(treatmentId, localFileRef),
      });
    },
    async remove(treatmentId, localFileRef) {
      await FileSystem.deleteAsync(patientPhotoFileUri(treatmentId, localFileRef), {
        idempotent: true,
      });
    },
    async getSize(uri) {
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || typeof info.size !== 'number') {
          return null;
        }
        return info.size;
      } catch {
        return null;
      }
    },
    fileUri(treatmentId, localFileRef) {
      return patientPhotoFileUri(treatmentId, localFileRef);
    },
  };
}
