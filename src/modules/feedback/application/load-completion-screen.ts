import type { ClinicContact, ClinicContactRepository } from '@/modules/clinic-contact';
import { loadClinicContact } from '@/modules/clinic-contact';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import type { FeedbackSurvey } from '../domain';
import type { FeedbackSurveyRepository } from '../infrastructure';

export type CompletionScreenResult =
  | { status: 'not_completed' }
  | { status: 'error' }
  | {
      status: 'ready';
      patientId: string;
      treatmentId: string;
      survey: FeedbackSurvey | null;
      clinicContact: ClinicContact;
    };

export async function loadCompletionScreen(deps: {
  treatmentRepository: TreatmentRepository;
  feedbackRepository: FeedbackSurveyRepository;
  clinicContactRepository: ClinicContactRepository;
}): Promise<CompletionScreenResult> {
  let treatment;
  try {
    treatment = await deps.treatmentRepository.getActiveTreatment();
  } catch {
    return { status: 'error' };
  }

  if (treatment === null || treatment.status !== 'completed') {
    return { status: 'not_completed' };
  }

  let survey: FeedbackSurvey | null;
  try {
    survey = await deps.feedbackRepository.getSurvey(treatment.id);
  } catch {
    return { status: 'error' };
  }

  const clinicContact = await loadClinicContact(deps.clinicContactRepository);

  return {
    status: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    survey,
    clinicContact,
  };
}
