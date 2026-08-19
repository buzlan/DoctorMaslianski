import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
  InvalidProductEventError,
  sharedProductEventSink,
} from '@/modules/product-events';
import type { ProductEvent } from '@/modules/product-events';
import * as productEvents from '@/modules/product-events';

const AT = '2026-08-19T15:00:00.000Z';

function treatmentContext() {
  return {
    at: AT,
    patientId: 'patient-1',
    treatmentId: 'treatment-1',
    protocolKind: 'sclerotherapy' as const,
    protocolVersion: 1,
    pilotCohort: DEVELOPMENT_PILOT_COHORT,
  };
}

function treatmentStartedEvent(): ProductEvent {
  return {
    name: 'treatment_started',
    ...treatmentContext(),
  };
}

function taskCompletedEvent(): ProductEvent {
  return {
    name: 'task_completed',
    ...treatmentContext(),
    entityId: 'task-1',
  };
}

function appOpenedBase(): ProductEvent {
  return {
    name: 'app_opened',
    at: AT,
    pilotCohort: DEVELOPMENT_PILOT_COHORT,
  };
}

describe('createInMemoryProductEventSink', () => {
  it('appends an event and preserves required segmentation', async () => {
    const sink = createInMemoryProductEventSink();
    const event = treatmentStartedEvent();

    await sink.append(event);

    expect(sink.getAll()).toEqual([event]);
    expect(sink.getAll()[0]).toMatchObject({
      name: 'treatment_started',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      protocolKind: 'sclerotherapy',
      protocolVersion: 1,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      at: AT,
    });
  });

  it('preserves insertion order', async () => {
    const sink = createInMemoryProductEventSink();
    const first = appOpenedBase();
    const second = treatmentStartedEvent();
    const third = taskCompletedEvent();

    await sink.append(first);
    await sink.append(second);
    await sink.append(third);

    expect(sink.getAll().map((event) => event.name)).toEqual([
      'app_opened',
      'treatment_started',
      'task_completed',
    ]);
  });

  it('isolates factory instances from each other and from the shared sink', async () => {
    const first = createInMemoryProductEventSink();
    const second = createInMemoryProductEventSink();
    const sharedBefore = sharedProductEventSink.getAll().length;

    await first.append(appOpenedBase());
    await second.append(treatmentStartedEvent());

    expect(first.getAll()).toHaveLength(1);
    expect(first.getAll()[0]?.name).toBe('app_opened');
    expect(second.getAll()).toHaveLength(1);
    expect(second.getAll()[0]?.name).toBe('treatment_started');
    expect(sharedProductEventSink.getAll()).toHaveLength(sharedBefore);
  });

  it('carries protocol kind and version on a treatment-related event', async () => {
    const sink = createInMemoryProductEventSink();
    await sink.append(taskCompletedEvent());

    const stored = sink.getAll()[0];
    expect(stored).toMatchObject({
      name: 'task_completed',
      protocolKind: 'sclerotherapy',
      protocolVersion: 1,
      entityId: 'task-1',
    });
  });
});

describe('app_opened context', () => {
  it('accepts base, patient-scoped, and treatment-scoped events', async () => {
    const sink = createInMemoryProductEventSink();

    await sink.append(appOpenedBase());
    await sink.append({
      name: 'app_opened',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'patient-1',
    });
    await sink.append({
      name: 'app_opened',
      ...treatmentContext(),
    });

    expect(sink.getAll()).toHaveLength(3);
    expect(sink.getAll()[0]).toEqual(appOpenedBase());
    expect(sink.getAll()[1]).toMatchObject({ patientId: 'patient-1' });
    expect(sink.getAll()[2]).toMatchObject({
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      protocolKind: 'sclerotherapy',
      protocolVersion: 1,
    });
  });

  it('rejects treatmentId without protocol context', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        name: 'app_opened',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });

  it('rejects protocolKind without protocolVersion', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        name: 'app_opened',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'patient-1',
        protocolKind: 'sclerotherapy',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });

  it('rejects entityId', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        ...appOpenedBase(),
        entityId: 'task-1',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });
});

describe('entityId', () => {
  it('accepts entityId on task_completed', async () => {
    const sink = createInMemoryProductEventSink();
    await sink.append(taskCompletedEvent());
    expect(sink.getAll()[0]).toMatchObject({ entityId: 'task-1' });
  });

  it('rejects entityId on treatment_started', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        ...treatmentStartedEvent(),
        entityId: 'task-1',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });
});

describe('privacy boundary', () => {
  it.each([
    ['answers', { pain: 8 }],
    ['metadata', { note: 'clinical' }],
    ['photoUrl', 'https://example.test/photo.jpg'],
    ['diagnosis', 'varices'],
    ['notes', 'doctor note'],
    ['text', 'free text'],
  ])('rejects clinical or free-form field %s', async (field, value) => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        name: 'checkin_submitted',
        ...treatmentContext(),
        entityId: 'checkin-1',
        [field]: value,
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });

  it('does not include rejected payload values in the error message', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        name: 'checkin_submitted',
        ...treatmentContext(),
        entityId: 'checkin-1',
        answers: { pain: 8 },
      } as ProductEvent),
    ).rejects.toThrow('unsupported event field: answers');
  });
});

describe('feedback_submitted', () => {
  it('accepts numeric usefulness and clarity scores and stores them unchanged', async () => {
    const sink = createInMemoryProductEventSink();
    const event: ProductEvent = {
      name: 'feedback_submitted',
      ...treatmentContext(),
      usefulnessScore: 1,
      clarityScore: 5,
    };

    await sink.append(event);

    expect(sink.getAll()[0]).toEqual(event);
    expect(sink.getAll()[0]).not.toHaveProperty('passed');
    expect(sink.getAll()[0]).not.toHaveProperty('successful');
  });

  it('rejects free text on feedback_submitted', async () => {
    const sink = createInMemoryProductEventSink();

    await expect(
      sink.append({
        name: 'feedback_submitted',
        ...treatmentContext(),
        usefulnessScore: 4,
        text: 'I felt better',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);

    await expect(
      sink.append({
        name: 'feedback_submitted',
        ...treatmentContext(),
        comment: 'unclear instructions',
      } as ProductEvent),
    ).rejects.toThrow(InvalidProductEventError);
  });
});

describe('product-events module', () => {
  it('does not export success thresholds', () => {
    const exportedNames = Object.keys(productEvents);
    expect(exportedNames.some((name) => /threshold|successRate|passed/i.test(name))).toBe(
      false,
    );
  });
});
