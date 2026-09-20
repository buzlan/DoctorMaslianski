import type { ClinicContactRepository } from '@/modules/clinic-contact';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import type { FeedbackSurveyRepository } from '../infrastructure';

import type { CompletionEventSession } from './completion-events';
import {
  loadCompletionScreen,
  type CompletionScreenResult,
} from './load-completion-screen';

export async function submitCompletionFeedback(deps: {
  treatmentRepository: TreatmentRepository;
  feedbackRepository: FeedbackSurveyRepository;
  clinicContactRepository: ClinicContactRepository;
  events: CompletionEventSession;
  now?: () => Date;
  answers: unknown;
}): Promise<CompletionScreenResult> {
  const now = deps.now ?? (() => new Date());

  let treatment;
  try {
    treatment = await deps.treatmentRepository.getActiveTreatment();
  } catch {
    return { status: 'error' };
  }

  if (treatment === null || treatment.status !== 'completed') {
    return { status: 'not_completed' };
  }

  try {
    const result = await deps.feedbackRepository.submitSurvey(
      treatment,
      now().toISOString(),
      deps.answers,
    );

    if (result.status === 'recorded' && !result.alreadyPresent) {
      await deps.events.emitFeedbackSubmittedIfNeeded({
        patientId: treatment.patientId,
        treatmentId: treatment.id,
        usefulnessScore: result.survey.usefulnessScore,
        clarityScore: result.survey.clarityScore,
      });
    }
  } catch {
    return { status: 'error' };
  }

  return loadCompletionScreen(deps);
}
