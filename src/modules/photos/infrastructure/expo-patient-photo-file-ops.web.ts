/**
 * In-memory photo bytes for web. Native keeps expo-file-system copies.
 * Blob URLs live only until upload succeeds or the patient removes the photo.
 */

import type { PatientPhotoFileOps } from './patient-photo-file-ops';

type StoredPhoto = {
  url: string;
  size: number;
};

export type WebPatientPhotoFileOpsDeps = {
  readBlob?: (uri: string) => Promise<Blob>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
};

function storageKey(treatmentId: string, localFileRef: string): string {
  return `${treatmentId}/${localFileRef}`;
}

async function readBlobFromUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('photo read failed');
  }
  return response.blob();
}

export function createWebPatientPhotoFileOps(
  deps: WebPatientPhotoFileOpsDeps = {},
): PatientPhotoFileOps {
  const files = new Map<string, StoredPhoto>();
  const readBlob = deps.readBlob ?? readBlobFromUri;
  const createObjectUrl = deps.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectUrl = deps.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));

  return {
    async copy(sourceUri, treatmentId, localFileRef) {
      const blob = await readBlob(sourceUri);
      const key = storageKey(treatmentId, localFileRef);
      const previous = files.get(key);
      if (previous !== undefined) {
        revokeObjectUrl(previous.url);
      }
      files.set(key, {
        url: createObjectUrl(blob),
        size: blob.size,
      });
    },
    async remove(treatmentId, localFileRef) {
      const key = storageKey(treatmentId, localFileRef);
      const current = files.get(key);
      if (current === undefined) {
        return;
      }
      revokeObjectUrl(current.url);
      files.delete(key);
    },
    async getSize(uri) {
      for (const file of files.values()) {
        if (file.url === uri) {
          return file.size;
        }
      }
      try {
        const blob = await readBlob(uri);
        return blob.size;
      } catch {
        return null;
      }
    },
    fileUri(treatmentId, localFileRef) {
      return files.get(storageKey(treatmentId, localFileRef))?.url ?? '';
    },
  };
}

export function createExpoPatientPhotoFileOps(): PatientPhotoFileOps {
  return createWebPatientPhotoFileOps();
}

export function patientPhotoDirectoryUri(treatmentId: string): string {
  return `web-memory://patient-photos/${encodeURIComponent(treatmentId)}/`;
}

export function patientPhotoFileUri(treatmentId: string, localFileRef: string): string {
  return `${patientPhotoDirectoryUri(treatmentId)}${localFileRef}`;
}
