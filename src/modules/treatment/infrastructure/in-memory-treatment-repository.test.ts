import { calendarDate, completionIdFor, createTreatment } from '../domain';
import type { ActionAssignment } from '../domain';

import {
  DEVELOPMENT_PERIOD_ID,
  DEVELOPMENT_TREATMENT_ID,
  developmentPatient,
} from './fixtures/pilot-patient';
import { createDevelopmentTreatment } from './fixtures/pilot-treatment';
import { createInMemoryTreatmentRepository } from './in-memory-treatment-repository';
import { sharedTreatmentRepository } from './shared-treatment-repository';

const INTAKE_MARKERS = [
  'TBD by clinic',
  'placeholder structure only',
  'pending clinic confirmation',
];

function assertNoIntakeMarkers(value: unknown): void {
  const json = JSON.stringify(value);
  for (const marker of INTAKE_MARKERS) {
    expect(json).not.toContain(marker);
  }
}

describe('development treatment fixture', () => {
  it('is a sclerotherapy treatment with a current period and empty assignments', () => {
    const treatment = createDevelopmentTreatment();

    expect(treatment.id).toBe(DEVELOPMENT_TREATMENT_ID);
    expect(treatment.patientId).toBe(developmentPatient.id);
    expect(treatment.treatmentContext).toBe('sclerotherapy');
    expect(treatment.status).toBe('active');
    expect(treatment.periods).toEqual([
      {
        id: DEVELOPMENT_PERIOD_ID,
        startedOn: { year: 2026, month: 8, day: 19 },
      },
    ]);
    expect(treatment.assignments).toEqual([]);
    expect(treatment.milestones).toEqual([]);
    expect(treatment.completions).toEqual([]);
    expect(treatment.appointments).toEqual([]);
    expect(treatment).not.toHaveProperty('protocolId');
    expect(treatment).not.toHaveProperty('protocolVersion');
    expect(treatment).not.toHaveProperty('snapshot');
    assertNoIntakeMarkers(treatment);
  });

  it('can be constructed as completed for TASK-028 shell verification', () => {
    const treatment = createDevelopmentTreatment({ status: 'completed' });

    expect(treatment.status).toBe('completed');
    expect(treatment.id).toBe(DEVELOPMENT_TREATMENT_ID);
  });
});

describe('createInMemoryTreatmentRepository', () => {
  it('returns the development sclerotherapy treatment from the default seed', async () => {
    const repository = createInMemoryTreatmentRepository();
    const treatment = await repository.getActiveTreatment();

    expect(treatment).not.toBeNull();
    expect(treatment?.id).toBe(DEVELOPMENT_TREATMENT_ID);
    expect(treatment?.patientId).toBe(developmentPatient.id);
    expect(treatment?.treatmentContext).toBe('sclerotherapy');
    expect(treatment?.status).toBe('active');
    expect(treatment?.assignments).toEqual([]);
    assertNoIntakeMarkers(treatment);
  });

  it('does not freeze the stored treatment', async () => {
    const treatment = await createInMemoryTreatmentRepository().getActiveTreatment();

    expect(treatment).not.toBeNull();
    expect(Object.isFrozen(treatment)).toBe(false);
    expect(Object.isFrozen(treatment?.completions)).toBe(false);
  });

  it('keeps stored rows when createTreatment inputs are mutated after assignment', async () => {
    const startedOn = calendarDate(2026, 8, 19);
    const assignment: ActionAssignment = {
      id: 'assignment-1',
      catalogItemId: 'catalog-1',
      title: 'Original',
      startDate: calendarDate(2026, 8, 19),
      endDate: calendarDate(2026, 8, 25),
      status: 'active',
    };
    const repository = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'assigned-v1',
        patientId: developmentPatient.id,
        periods: [{ id: 'period-1', startedOn }],
        assignments: [assignment],
      }),
    });

    startedOn.day = 1;
    assignment.title = 'Changed';
    assignment.status = 'disabled';

    const treatment = await repository.getActiveTreatment();

    expect(treatment?.id).toBe('assigned-v1');
    expect(treatment?.periods[0]?.startedOn).toEqual({ year: 2026, month: 8, day: 19 });
    expect(treatment?.assignments[0]?.title).toBe('Original');
    expect(treatment?.assignments[0]?.status).toBe('active');
  });

  it('isolates factory instances from each other', async () => {
    const first = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'first',
        patientId: developmentPatient.id,
      }),
    });
    const second = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'second',
        patientId: developmentPatient.id,
        status: 'completed',
      }),
    });

    const firstTreatment = await first.getActiveTreatment();
    const secondTreatment = await second.getActiveTreatment();

    expect(firstTreatment?.id).toBe('first');
    expect(firstTreatment?.status).toBe('active');
    expect(secondTreatment?.id).toBe('second');
    expect(secondTreatment?.status).toBe('completed');
  });

  it('returns null when seeded empty', async () => {
    const repository = createInMemoryTreatmentRepository({ empty: true });
    await expect(repository.getActiveTreatment()).resolves.toBeNull();
  });
});

describe('sharedTreatmentRepository', () => {
  it('returns the development sclerotherapy assignment', async () => {
    const treatment = await sharedTreatmentRepository.getActiveTreatment();

    expect(treatment?.id).toBe(DEVELOPMENT_TREATMENT_ID);
    expect(treatment?.treatmentContext).toBe('sclerotherapy');
    expect(treatment?.status).toBe('active');
    expect(treatment?.periods[0]?.id).toBe(DEVELOPMENT_PERIOD_ID);
  });
});

const ON_DATE = calendarDate(2026, 8, 1);

function syntheticAssignment(
  options: Partial<ActionAssignment> & Pick<ActionAssignment, 'id'> = { id: 'assignment-1' },
): ActionAssignment {
  return {
    catalogItemId: 'catalog-1',
    startDate: ON_DATE,
    endDate: calendarDate(2026, 8, 7),
    status: 'active',
    ...options,
  };
}

function repositoryWithAssignment(assignment: ActionAssignment = syntheticAssignment()) {
  return createInMemoryTreatmentRepository({
    treatment: createTreatment({
      id: 'treatment-1',
      patientId: developmentPatient.id,
      periods: [{ id: 'period-1', startedOn: ON_DATE }],
      milestones: [{ id: 'milestone-1' }],
      assignments: [assignment],
    }),
  });
}

describe('completeAssignment', () => {
  it('records a completion keyed by assignment id, not a snapshot task id', async () => {
    const repository = repositoryWithAssignment();

    await expect(repository.completeAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'recorded',
      alreadyPresent: false,
      patientId: developmentPatient.id,
      treatmentId: 'treatment-1',
      completion: {
        id: completionIdFor('assignment-1', ON_DATE),
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    });

    const treatment = await repository.getActiveTreatment();
    expect(treatment?.completions).toEqual([
      {
        id: completionIdFor('assignment-1', ON_DATE),
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    ]);
    expect(treatment).not.toHaveProperty('snapshot');
    expect(treatment?.completions[0]).not.toHaveProperty('taskId');
  });

  it('is idempotent for a repeated complete of the same assignment and date', async () => {
    const repository = repositoryWithAssignment();

    const first = await repository.completeAssignment('assignment-1', ON_DATE);
    const second = await repository.completeAssignment('assignment-1', ON_DATE);
    const treatment = await repository.getActiveTreatment();

    expect(first).toMatchObject({ status: 'recorded', alreadyPresent: false });
    expect(second).toMatchObject({ status: 'recorded', alreadyPresent: true });
    expect(treatment?.completions).toHaveLength(1);
    expect(treatment?.completions[0]?.id).toBe(completionIdFor('assignment-1', ON_DATE));
  });

  it('does not change assignments, periods, or milestones', async () => {
    const repository = repositoryWithAssignment();
    const before = await repository.getActiveTreatment();

    await repository.completeAssignment('assignment-1', ON_DATE);
    const after = await repository.getActiveTreatment();

    expect(after?.assignments).toEqual(before?.assignments);
    expect(after?.periods).toEqual(before?.periods);
    expect(after?.milestones).toEqual(before?.milestones);
  });

  it('ignores a write when seeded empty', async () => {
    const repository = createInMemoryTreatmentRepository({ empty: true });

    await expect(repository.completeAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'ignored',
      reason: 'no_active_treatment',
    });
  });

  it('ignores a write against a disabled assignment seeded from the start', async () => {
    const repository = repositoryWithAssignment(
      syntheticAssignment({ id: 'assignment-1', status: 'disabled' }),
    );

    await expect(repository.completeAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });

    const treatment = await repository.getActiveTreatment();
    expect(treatment?.completions).toEqual([]);
    expect(treatment?.assignments[0]?.status).toBe('disabled');
  });

  it('isolates completions between factory instances', async () => {
    const first = repositoryWithAssignment();
    const second = repositoryWithAssignment();

    await first.completeAssignment('assignment-1', ON_DATE);

    expect((await first.getActiveTreatment())?.completions).toHaveLength(1);
    expect((await second.getActiveTreatment())?.completions).toEqual([]);
  });
});

describe('uncompleteAssignment', () => {
  it('clears a completion and records the same deterministic id on complete again', async () => {
    const repository = repositoryWithAssignment();

    await repository.completeAssignment('assignment-1', ON_DATE);
    await expect(repository.uncompleteAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'cleared',
      alreadyAbsent: false,
    });
    expect((await repository.getActiveTreatment())?.completions).toEqual([]);

    const recorded = await repository.completeAssignment('assignment-1', ON_DATE);
    expect(recorded).toMatchObject({
      status: 'recorded',
      alreadyPresent: false,
      completion: { id: completionIdFor('assignment-1', ON_DATE) },
    });
    expect((await repository.getActiveTreatment())?.completions).toHaveLength(1);
  });

  it('is idempotent when no completion exists', async () => {
    const repository = repositoryWithAssignment();

    await expect(repository.uncompleteAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'cleared',
      alreadyAbsent: true,
    });
  });

  it('ignores uncomplete against a disabled assignment seeded from the start', async () => {
    const repository = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'treatment-1',
        patientId: developmentPatient.id,
        assignments: [syntheticAssignment({ id: 'assignment-1', status: 'disabled' })],
        completions: [
          {
            id: 'kept',
            assignmentId: 'assignment-1',
            completedOn: ON_DATE,
          },
        ],
      }),
    });

    await expect(repository.uncompleteAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect((await repository.getActiveTreatment())?.completions).toEqual([
      {
        id: 'kept',
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    ]);
  });
});
