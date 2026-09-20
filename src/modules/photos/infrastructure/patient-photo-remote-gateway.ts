import * as FileSystem from 'expo-file-system/legacy';

import {
  classifyPostgrestWriteError,
  RetryableRemoteError,
  type RemoteWriteResult,
} from '@/core/sync/remote-error';
import type { AppSupabaseClient } from '@/core/supabase/client';

import {
  classifyStorageUploadError,
  type StorageUploadResult,
} from './classify-storage-upload-error';
import type { RemotePatientPhotoRow } from './map-remote-patient-photo';

export type PatientPhotoInsertInput = {
  id: string;
  treatmentId: string;
  patientId: string;
  clinicId: string;
  submittedOn: string;
  slot: number;
  storagePath: string;
  contentType: string;
};

export type PatientPhotoRemoteGateway = {
  listPhotos(treatmentId: string): Promise<readonly RemotePatientPhotoRow[]>;
  insertPhoto(input: PatientPhotoInsertInput): Promise<RemoteWriteResult>;
  selectBySlot(input: {
    treatmentId: string;
    submittedOn: string;
    slot: number;
  }): Promise<RemotePatientPhotoRow | null>;
  uploadObject(input: {
    path: string;
    bytes: ArrayBuffer;
    contentType: string;
  }): Promise<StorageUploadResult>;
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export async function readLocalFileArrayBuffer(uri: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(uri);
    if (response.ok) {
      return response.arrayBuffer();
    }
  } catch {
    // Android Expo Go cannot fetch file:// URIs. Fall through to FileSystem.
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToArrayBuffer(base64);
  } catch {
    throw new RetryableRemoteError('photo file read failed');
  }
}

export function createSupabasePatientPhotoGateway(
  client: AppSupabaseClient,
): PatientPhotoRemoteGateway {
  return {
    async listPhotos(treatmentId) {
      const { data, error } = await client
        .from('patient_photos')
        .select('id, treatment_id, patient_id, submitted_on, slot')
        .eq('treatment_id', treatmentId);

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      return data ?? [];
    },
    async insertPhoto(input) {
      const { error } = await client.from('patient_photos').insert({
        id: input.id,
        treatment_id: input.treatmentId,
        patient_id: input.patientId,
        clinic_id: input.clinicId,
        submitted_on: input.submittedOn,
        slot: input.slot,
        storage_bucket: 'patient-photos',
        storage_path: input.storagePath,
        content_type: input.contentType,
      });

      return classifyPostgrestWriteError(error);
    },
    async selectBySlot(input) {
      const { data, error } = await client
        .from('patient_photos')
        .select('id, treatment_id, patient_id, submitted_on, slot')
        .eq('treatment_id', input.treatmentId)
        .eq('submitted_on', input.submittedOn)
        .eq('slot', input.slot)
        .maybeSingle();

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      return data ?? null;
    },
    async uploadObject(input) {
      const { error } = await client.storage.from('patient-photos').upload(input.path, input.bytes, {
        contentType: input.contentType,
        upsert: false,
      });

      return classifyStorageUploadError(error);
    },
  };
}
