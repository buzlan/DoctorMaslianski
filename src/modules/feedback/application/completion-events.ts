import {
  DEVELOPMENT_PILOT_COHORT,
  type ProductEventSink,
} from '@/modules/product-events';
import type { PilotCohort } from '@/modules/treatment/domain';

export type CompletionEventSession = {
  emitJourneyCompletedIfNeeded(input: {
    patientId: string;
    treatmentId: string;
  }): Promise<void>;
  emitFeedbackSubmittedIfNeeded(input: {
    patientId: string;
    treatmentId: string;
    usefulnessScore: number;
    clarityScore: number;
  }): Promise<void>;
};

export function createCompletionEventSession(deps: {
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
}): CompletionEventSession {
  const now = deps.now ?? (() => new Date());
  const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
  const journeyCompleted = new Set<string>();
  const feedbackSubmitted = new Set<string>();

  return {
    async emitJourneyCompletedIfNeeded(input) {
      if (journeyCompleted.has(input.treatmentId)) {
        return;
      }
      journeyCompleted.add(input.treatmentId);
      await deps.eventSink.append({
        name: 'treatment_journey_completed',
        at: now().toISOString(),
        pilotCohort,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
      });
    },
    async emitFeedbackSubmittedIfNeeded(input) {
      if (feedbackSubmitted.has(input.treatmentId)) {
        return;
      }
      feedbackSubmitted.add(input.treatmentId);
      await deps.eventSink.append({
        name: 'feedback_submitted',
        at: now().toISOString(),
        pilotCohort,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
        usefulnessScore: input.usefulnessScore,
        clarityScore: input.clarityScore,
      });
    },
  };
}
