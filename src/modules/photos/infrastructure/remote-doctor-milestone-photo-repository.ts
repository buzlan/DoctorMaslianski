import { RetryableRemoteError } from '@/core/sync/remote-error';
import type { AppSupabaseClient } from '@/core/supabase/client';
import { createDoctorMilestonePhoto, type DoctorMilestonePhoto } from '../domain';

import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';

export const DOCTOR_PHOTO_SIGNED_URL_TTL_SECONDS = 300;
export const DOCTOR_PHOTO_SIGNED_URL_REFRESH_SKEW_MS = 30_000;

export type DoctorMilestonePhotoRemoteGateway = {
  listPhotos(treatmentId: string): Promise<
    readonly {
      id: string;
      treatment_id: string;
      milestone_id: string;
      storage_path: string;
    }[]
  >;
  createSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string | null>;
};

export function createSupabaseDoctorMilestonePhotoGateway(
  client: AppSupabaseClient,
): DoctorMilestonePhotoRemoteGateway {
  return {
    async listPhotos(treatmentId) {
      const { data, error } = await client
        .from('doctor_milestone_photos')
        .select('id, treatment_id, milestone_id, storage_path')
        .eq('treatment_id', treatmentId);

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      return data ?? [];
    },
    async createSignedUrl(storagePath, expiresInSeconds) {
      const { data, error } = await client.storage
        .from('doctor-milestone-photos')
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || data?.signedUrl === undefined || data.signedUrl.length === 0) {
        return null;
      }

      return data.signedUrl;
    },
  };
}

type CachedSignedUrl = {
  url: string;
  expiresAtMs: number;
};

export function createRemoteDoctorMilestonePhotoRepository(options: {
  gateway: DoctorMilestonePhotoRemoteGateway;
  readAuthUserId?: () => string | null;
  now?: () => number;
}): DoctorMilestonePhotoRepository {
  const cache = new Map<string, CachedSignedUrl>();
  let cacheUserId: string | null = null;
  const readAuthUserId = options.readAuthUserId ?? (() => null);
  const now = options.now ?? (() => Date.now());

  function resetCacheIfUserChanged(): void {
    const userId = readAuthUserId();
    if (cacheUserId !== userId) {
      cache.clear();
      cacheUserId = userId;
    }
  }

  return {
    async listPhotos(treatmentId) {
      const rows = await options.gateway.listPhotos(treatmentId);
      const photos: DoctorMilestonePhoto[] = [];

      for (const row of rows) {
        try {
          photos.push(
            createDoctorMilestonePhoto({
              id: row.id,
              treatmentId: row.treatment_id,
              milestoneId: row.milestone_id,
              storageRef: row.storage_path,
            }),
          );
        } catch {
          // Skip malformed metadata.
        }
      }

      return photos;
    },
    async resolveDisplayUri(photo) {
      resetCacheIfUserChanged();
      const cached = cache.get(photo.storageRef);
      const currentMs = now();
      if (
        cached !== undefined &&
        cached.expiresAtMs - currentMs > DOCTOR_PHOTO_SIGNED_URL_REFRESH_SKEW_MS
      ) {
        return cached.url;
      }

      try {
        const signedUrl = await options.gateway.createSignedUrl(
          photo.storageRef,
          DOCTOR_PHOTO_SIGNED_URL_TTL_SECONDS,
        );
        if (signedUrl === null || signedUrl.length === 0) {
          return null;
        }

        cache.set(photo.storageRef, {
          url: signedUrl,
          expiresAtMs: currentMs + DOCTOR_PHOTO_SIGNED_URL_TTL_SECONDS * 1000,
        });
        return signedUrl;
      } catch {
        return null;
      }
    },
  };
}
