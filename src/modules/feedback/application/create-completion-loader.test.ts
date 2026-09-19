import { createInMemoryClinicContactRepository } from '@/modules/clinic-contact';
import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { createTreatment } from '@/modules/treatment/domain';
import { createInMemoryTreatmentRepository } from '@/modules/treatment/infrastructure';

import { createInMemoryFeedbackSurveyRepository } from '../infrastructure';

import { createCompletionEventSession } from './completion-events';
import { createCompletionLoader } from './create-completion-loader';

const AT = '2026-08-19T15:00:00.000Z';

function completed() {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: 'completed',
  });
}

function createLoader(options?: {
  treatment?: ReturnType<typeof createTreatment>;
  empty?: boolean;
  contact?: { phone?: string };
}) {
  const sink = createInMemoryProductEventSink();
  const loader = createCompletionLoader({
    treatmentRepository: createInMemoryTreatmentRepository(
      options?.empty === true
        ? { empty: true }
        : { treatment: options?.treatment ?? completed() },
    ),
    feedbackRepository: createInMemoryFeedbackSurveyRepository(),
    clinicContactRepository: createInMemoryClinicContactRepository(
      options?.contact ?? {},
    ),
    events: createCompletionEventSession({
      eventSink: sink,
      now: () => new Date(AT),
    }),
    now: () => new Date(AT),
  });

  return { loader, sink };
}

describe('createCompletionLoader', () => {
  it('loads the completion screen with contact and no survey', async () => {
    const { loader, sink } = createLoader({ contact: { phone: '+375000000000' } });

    const result = await loader.loadScreen();

    expect(result).toEqual({
      status: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      survey: null,
      clinicContact: { phone: '+375000000000' },
    });
    expect(sink.getAll()).toEqual([
      {
        name: 'treatment_journey_completed',
        at: AT,
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
      },
    ]);
    expect(sink.getAll()[0]).not.toHaveProperty('protocolKind');
    expect(sink.getAll()[0]).not.toHaveProperty('protocolVersion');
  });

  it('emits treatment_journey_completed only once per treatment', async () => {
    const { loader, sink } = createLoader();

    await loader.loadScreen();
    await loader.loadScreen();

    expect(sink.getAll().map((event) => event.name)).toEqual([
      'treatment_journey_completed',
    ]);
  });

  it('returns not_completed for active and cancelled treatments', async () => {
    const active = createLoader({
      treatment: createTreatment({ id: 'treatment-1', patientId: 'patient-1' }),
    });
    const cancelled = createLoader({
      treatment: createTreatment({
        id: 'treatment-1',
        patientId: 'patient-1',
        status: 'cancelled',
      }),
    });

    await expect(active.loader.loadScreen()).resolves.toEqual({ status: 'not_completed' });
    await expect(cancelled.loader.loadScreen()).resolves.toEqual({
      status: 'not_completed',
    });
    expect(active.sink.getAll()).toEqual([]);
    expect(cancelled.sink.getAll()).toEqual([]);
  });

  it('submits numeric scores on the survey entity and on ProductEvent, with no free text', async () => {
    const { loader, sink } = createLoader();

    await loader.loadScreen();
    const submitted = await loader.submit({
      usefulnessScore: 5,
      clarityScore: 4,
    });

    expect(submitted).toMatchObject({
      status: 'ready',
      survey: {
        usefulnessScore: 5,
        clarityScore: 4,
      },
    });
    if (submitted.status === 'ready') {
      expect(submitted.survey).not.toHaveProperty('freeText');
    }

    const events = sink.getAll();
    expect(events.map((event) => event.name)).toEqual([
      'treatment_journey_completed',
      'feedback_submitted',
    ]);
    expect(events[1]).toEqual({
      name: 'feedback_submitted',
      at: AT,
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      usefulnessScore: 5,
      clarityScore: 4,
    });
    expect(events[1]).not.toHaveProperty('freeText');
    expect(events[1]).not.toHaveProperty('text');
    expect(events[1]).not.toHaveProperty('comment');
  });

  it('does not emit a second feedback_submitted for a repeat submit', async () => {
    const { loader, sink } = createLoader();

    await loader.loadScreen();
    await loader.submit({ usefulnessScore: 2, clarityScore: 3 });
    await loader.submit({ usefulnessScore: 1, clarityScore: 1 });

    expect(sink.getAll().filter((event) => event.name === 'feedback_submitted')).toHaveLength(
      1,
    );
  });
});
