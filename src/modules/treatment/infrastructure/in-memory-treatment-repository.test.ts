import { calendarDate, createTreatment } from '../domain';
import type { ActionAssignment } from '../domain';

import {
  DEVELOPMENT_PERIOD_ID,
  DEVELOPMENT_TREATMENT_ID,
  developmentPatient,
} from './fixtures/pilot-patient';
import { createDevelopmentTreatment } from './fixtures/pilot-treatment';
import {
  createInMemoryTreatmentRepository,
  sharedTreatmentRepository,
} from './in-memory-treatment-repository';

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
