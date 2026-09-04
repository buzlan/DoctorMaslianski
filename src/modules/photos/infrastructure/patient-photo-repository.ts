import type { CalendarDate, Treatment } from '@/modules/treatment/domain';

import type { CapturedImage, PatientPhoto } from '../domain';

export type RecordCapturedPatientPhotoResult =
  | {
      status: 'recorded';
      photo: PatientPhoto;
    }
  | {
      status: 'ignored';
      reason: 'no_active_treatment' | 'daily_cap_reached' | 'invalid_source';
    };

export type PatientPhotoRepository = {
  listPhotos(treatmentId: string): Promise<readonly PatientPhoto[]>;
  recordPhoto(
    treatment: Treatment,
    onDate: CalendarDate,
    captured: CapturedImage,
  ): Promise<RecordCapturedPatientPhotoResult>;
};
