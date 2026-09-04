import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import { createInMemoryTreatmentRepository } from '@/modules/treatment/infrastructure';

import {
  completeTodayAssignment,
  uncompleteTodayAssignment,
} from './complete-today-assignment';

const ON_DATE = calendarDate(2026, 8, 1);
const AT = '2026-08-19T15:00:00.000Z';

function repositoryWithSyntheticAssignment() {
  return createInMemoryTreatmentRepository({
    treatment: createTreatment({
      id: 'treatment-1',
      patientId: 'dev-patient-1',
      periods: [{ id: 'current', startedOn: ON_DATE }],
      assignments: [
        {
          id: 'assignment-1',
          catalogItemId: 'catalog-1',
          title: 'synthetic-task-title',
          instruction: 'synthetic-task-instruction',
          startDate: ON_DATE,
          endDate: ON_DATE,
          status: 'active',
        },
      ],
    }),
  });
}

describe('completeTodayAssignment', () => {
  it('reloads the overview with completed true and emits task_completed with assignment id only', async () => {
    const repository = repositoryWithSyntheticAssignment();
    const eventSink = createInMemoryProductEventSink();
    const now = () => new Date(AT);

    const result = await completeTodayAssignment(
      { repository, eventSink, now },
      'assignment-1',
      ON_DATE,
    );

    expect(result).toMatchObject({
      status: 'ready',
      overview: {
        assignments: [{ id: 'assignment-1', completed: true }],
      },
    });
    expect(eventSink.getAll()).toEqual([
      {
        name: 'task_completed',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        entityId: 'assignment-1',
      },
    ]);
    const event = eventSink.getAll()[0];
    expect(event).not.toHaveProperty('protocolKind');
    expect(event).not.toHaveProperty('protocolVersion');
    expect(event).not.toHaveProperty('title');
    expect(event).not.toHaveProperty('instruction');
    expect(JSON.stringify(event)).not.toContain('synthetic-task');
  });

  it('does not emit a second task_completed for an idempotent repeat', async () => {
    const repository = repositoryWithSyntheticAssignment();
    const eventSink = createInMemoryProductEventSink();
    const deps = { repository, eventSink, now: () => new Date(AT) };

    await completeTodayAssignment(deps, 'assignment-1', ON_DATE);
    await completeTodayAssignment(deps, 'assignment-1', ON_DATE);

    expect(eventSink.getAll()).toHaveLength(1);
  });
});

describe('uncompleteTodayAssignment', () => {
  it('clears current completion state without deleting historical task_completed events', async () => {
    const repository = repositoryWithSyntheticAssignment();
    const eventSink = createInMemoryProductEventSink();
    const deps = { repository, eventSink, now: () => new Date(AT) };

    await completeTodayAssignment(deps, 'assignment-1', ON_DATE);
    const result = await uncompleteTodayAssignment({ repository }, 'assignment-1', ON_DATE);

    expect(result).toMatchObject({
      status: 'ready',
      overview: {
        assignments: [{ id: 'assignment-1', completed: false }],
      },
    });
    expect(eventSink.getAll()).toEqual([
      {
        name: 'task_completed',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        entityId: 'assignment-1',
      },
    ]);
    expect(eventSink.getAll().map((event) => event.name)).toEqual(['task_completed']);
  });
});
