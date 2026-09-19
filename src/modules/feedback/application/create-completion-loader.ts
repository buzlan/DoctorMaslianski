import {
  sharedClinicContactRepository,
  type ClinicContactRepository,
} from '@/modules/clinic-contact';
import { sharedProductEventSink } from '@/modules/product-events';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import {
  sharedFeedbackSurveyRepository,
  type FeedbackSurveyRepository,
} from '../infrastructure';

import {
  createCompletionEventSession,
  type CompletionEventSession,
} from './completion-events';
import { loadCompletionScreen, type CompletionScreenResult } from './load-completion-screen';
import { loadTreatmentShell, type TreatmentShell } from './load-treatment-shell';
import { submitCompletionFeedback } from './submit-completion-feedback';

export type CompletionLoader = {
  loadShell(): Promise<TreatmentShell>;
  loadScreen(): Promise<CompletionScreenResult>;
  submit(answers: unknown): Promise<CompletionScreenResult>;
};

export function createCompletionLoader(deps: {
  treatmentRepository: TreatmentRepository;
  feedbackRepository: FeedbackSurveyRepository;
  clinicContactRepository: ClinicContactRepository;
  events: CompletionEventSession;
  now?: () => Date;
}): CompletionLoader {
  return {
    loadShell() {
      return loadTreatmentShell(deps.treatmentRepository);
    },
    async loadScreen() {
      const result = await loadCompletionScreen(deps);
      if (result.status === 'ready') {
        await deps.events.emitJourneyCompletedIfNeeded({
          patientId: result.patientId,
          treatmentId: result.treatmentId,
        });
      }
      return result;
    },
    submit(answers) {
      return submitCompletionFeedback({ ...deps, answers });
    },
  };
}

export const sharedCompletionEventSession = createCompletionEventSession({
  eventSink: sharedProductEventSink,
});

export const sharedCompletionLoader = createCompletionLoader({
  treatmentRepository: sharedTreatmentRepository,
  feedbackRepository: sharedFeedbackSurveyRepository,
  clinicContactRepository: sharedClinicContactRepository,
  events: sharedCompletionEventSession,
});

export function loadSharedTreatmentShell(): Promise<TreatmentShell> {
  return loadTreatmentShell(sharedTreatmentRepository);
}
