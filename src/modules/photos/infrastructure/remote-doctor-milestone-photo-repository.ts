import { RetryableRemoteError } from '@/core/sync/remote-error';
import type { AppSupabaseClient } from '@/core/supabase/client';
import { createDoctorMilestonePhoto, type DoctorMilestonePhoto } from '../domain';

import type { DoctorMilestonePhotoRepository } from './doctor-milestone-photo-repository';

export type DoctorMilestonePhotoRemoteGateway = {
  listPhotos(treatmentId: string): Promise<
    readonly {
      id: string;
      treatment_id: string;
      milestone_id: string;
      storage_path: string;
    }[]
  >;
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
  };
}

export function createRemoteDoctorMilestonePhotoRepository(options: {
  gateway: DoctorMilestonePhotoRemoteGateway;
}): DoctorMilestonePhotoRepository {
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
          // Skip malformed metadata. Display URIs remain TASK-032.
        }
      }

      return photos;
    },
    resolveDisplayUri() {
      return Promise.resolve(null);
    },
  };
}
