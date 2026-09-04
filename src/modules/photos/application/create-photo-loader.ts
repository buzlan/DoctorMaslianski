import {
  DEVELOPMENT_PILOT_COHORT,
  sharedProductEventSink,
  type ProductEventSink,
} from '@/modules/product-events';
import { isActiveTreatment, type CalendarDate, type PilotCohort } from '@/modules/treatment/domain';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  countPatientPhotosOnDate,
  type CapturedImage,
} from '../domain';
import {
  createExpoImagePickerCapture,
  sharedPatientPhotoRepository,
  type PatientPhotoCapturePort,
  type PatientPhotoRepository,
  type RecordCapturedPatientPhotoResult,
} from '../infrastructure';

import { confirmPatientPhoto } from './confirm-patient-photo';

export type PhotoTodayState =
  | {
      status: 'ready';
      patientId: string;
      treatmentId: string;
      photosRecordedToday: number;
      photoAddOpen: boolean;
    }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

export type PatientPhotoLoader = {
  load(onDate: CalendarDate): Promise<PhotoTodayState>;
  captureFromCamera(): ReturnType<PatientPhotoCapturePort['captureFromCamera']>;
  pickFromLibrary(): ReturnType<PatientPhotoCapturePort['pickFromLibrary']>;
  confirm(
    onDate: CalendarDate,
    captured: CapturedImage,
  ): Promise<RecordCapturedPatientPhotoResult | { status: 'error' }>;
};

export function createPatientPhotoLoader(deps: {
  treatmentRepository: TreatmentRepository;
  photoRepository: PatientPhotoRepository;
  capture: PatientPhotoCapturePort;
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
}): PatientPhotoLoader {
  return {
    async load(onDate) {
      try {
        const treatment = await deps.treatmentRepository.getActiveTreatment();
        if (treatment === null || !isActiveTreatment(treatment)) {
          return { status: 'no_active_treatment' };
        }

        const photos = await deps.photoRepository.listPhotos(treatment.id);
        const photosRecordedToday = countPatientPhotosOnDate(photos, onDate);
        return {
          status: 'ready',
          patientId: treatment.patientId,
          treatmentId: treatment.id,
          photosRecordedToday,
          photoAddOpen: photosRecordedToday < 3,
        };
      } catch {
        return { status: 'error' };
      }
    },
    captureFromCamera() {
      return deps.capture.captureFromCamera();
    },
    pickFromLibrary() {
      return deps.capture.pickFromLibrary();
    },
    confirm(onDate, captured) {
      return confirmPatientPhoto(
        {
          treatmentRepository: deps.treatmentRepository,
          photoRepository: deps.photoRepository,
          eventSink: deps.eventSink,
          now: deps.now,
          pilotCohort: deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT,
        },
        onDate,
        captured,
      );
    },
  };
}

export const sharedPatientPhotoLoader = createPatientPhotoLoader({
  treatmentRepository: sharedTreatmentRepository,
  photoRepository: sharedPatientPhotoRepository,
  capture: createExpoImagePickerCapture(),
  eventSink: sharedProductEventSink,
});
