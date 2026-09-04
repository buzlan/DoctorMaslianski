import {
  DEVELOPMENT_PILOT_COHORT,
  type ProductEventSink,
} from '@/modules/product-events';
import { isActiveTreatment, type CalendarDate, type PilotCohort } from '@/modules/treatment/domain';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import type { CapturedImage } from '../domain';
import type {
  PatientPhotoRepository,
  RecordCapturedPatientPhotoResult,
} from '../infrastructure';

export async function confirmPatientPhoto(
  deps: {
    treatmentRepository: TreatmentRepository;
    photoRepository: PatientPhotoRepository;
    eventSink: ProductEventSink;
    now?: () => Date;
    pilotCohort?: PilotCohort;
  },
  onDate: CalendarDate,
  captured: CapturedImage,
): Promise<RecordCapturedPatientPhotoResult | { status: 'error' }> {
  let treatment;
  try {
    treatment = await deps.treatmentRepository.getActiveTreatment();
  } catch {
    return { status: 'error' };
  }

  if (treatment === null || !isActiveTreatment(treatment)) {
    return { status: 'ignored', reason: 'no_active_treatment' };
  }

  let result: RecordCapturedPatientPhotoResult;
  try {
    result = await deps.photoRepository.recordPhoto(treatment, onDate, captured);
  } catch {
    return { status: 'error' };
  }

  if (result.status === 'recorded') {
    const now = deps.now ?? (() => new Date());
    const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
    await deps.eventSink.append({
      name: 'patient_photo_added',
      at: now().toISOString(),
      pilotCohort,
      patientId: treatment.patientId,
      treatmentId: treatment.id,
      entityId: result.photo.id,
    });
  }

  return result;
}
