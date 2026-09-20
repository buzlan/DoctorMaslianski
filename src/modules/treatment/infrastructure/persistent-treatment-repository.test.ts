import { calendarDate, completionIdFor, createTreatment } from '../domain';
import type { ActionAssignment } from '../domain';

import { createInMemoryCompletionOverlayStore } from './in-memory-completion-overlay-store';
import { createPersistentTreatmentRepository } from './persistent-treatment-repository';

const ON_DATE = calendarDate(2026, 8, 1);
const OTHER_DATE = calendarDate(2026, 8, 2);
const TREATMENT_ID = 'treatment-1';

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

function seededTreatment(assignment: ActionAssignment = syntheticAssignment()) {
  return createTreatment({
    id: TREATMENT_ID,
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
    milestones: [{ id: 'milestone-1' }],
    assignments: [assignment],
  });
}

function createRepository(
  store = createInMemoryCompletionOverlayStore(),
  assignment: ActionAssignment = syntheticAssignment(),
) {
  return {
    store,
    repository: createPersistentTreatmentRepository({
      seed: { treatment: seededTreatment(assignment) },
      store,
    }),
  };
}

describe('createPersistentTreatmentRepository', () => {
  it('reloads completions from the overlay store into a new repository instance', async () => {
    const { store, repository } = createRepository();

    await repository.completeAssignment('assignment-1', ON_DATE);

    const restarted = createPersistentTreatmentRepository({
      seed: { treatment: seededTreatment() },
      store,
    });
    const treatment = await restarted.getActiveTreatment();

    expect(treatment?.completions).toEqual([
      {
        id: completionIdFor('assignment-1', ON_DATE),
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    ]);
    expect(JSON.parse(store.getRaw(TREATMENT_ID) ?? '')).not.toHaveProperty('assignments');
    expect(JSON.parse(store.getRaw(TREATMENT_ID) ?? '')).not.toHaveProperty('periods');
    expect(store.getRaw(TREATMENT_ID)).not.toContain('catalog-1');
  });

  it('persists uncomplete of one date without dropping another date', async () => {
    const { store, repository } = createRepository();

    await repository.completeAssignment('assignment-1', ON_DATE);
    await repository.completeAssignment('assignment-1', OTHER_DATE);
    await repository.uncompleteAssignment('assignment-1', ON_DATE);

    const restarted = createPersistentTreatmentRepository({
      seed: { treatment: seededTreatment() },
      store,
    });

    expect((await restarted.getActiveTreatment())?.completions).toEqual([
      {
        id: completionIdFor('assignment-1', OTHER_DATE),
        assignmentId: 'assignment-1',
        completedOn: OTHER_DATE,
      },
    ]);
  });

  it('keeps a persisted completion when the restarted seed disables that assignment', async () => {
    const { store, repository } = createRepository();
    await repository.completeAssignment('assignment-1', ON_DATE);

    const restarted = createPersistentTreatmentRepository({
      seed: {
        treatment: seededTreatment(syntheticAssignment({ id: 'assignment-1', status: 'disabled' })),
      },
      store,
    });
    const treatment = await restarted.getActiveTreatment();

    expect(treatment?.completions).toEqual([
      {
        id: completionIdFor('assignment-1', ON_DATE),
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    ]);
    expect(treatment?.assignments[0]?.status).toBe('disabled');
    await expect(restarted.uncompleteAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect((await restarted.getActiveTreatment())?.completions).toHaveLength(1);
  });

  it('rebuilds plan-of-care fields from the seed, not from disk', async () => {
    const { store, repository } = createRepository(
      createInMemoryCompletionOverlayStore(),
      syntheticAssignment({ id: 'assignment-1', title: 'Original' }),
    );
    await repository.completeAssignment('assignment-1', ON_DATE);

    const restarted = createPersistentTreatmentRepository({
      seed: {
        treatment: seededTreatment(
          syntheticAssignment({ id: 'assignment-1', title: 'Updated seed title' }),
        ),
      },
      store,
    });
    const treatment = await restarted.getActiveTreatment();

    expect(treatment?.assignments[0]?.title).toBe('Updated seed title');
    expect(treatment?.completions).toHaveLength(1);
  });

  it('uses an empty overlay when stored JSON is corrupt and does not overwrite it until a write', async () => {
    const store = createInMemoryCompletionOverlayStore();
    store.seedRaw(TREATMENT_ID, '{not-json');

    const repository = createPersistentTreatmentRepository({
      seed: { treatment: seededTreatment() },
      store,
    });

    expect((await repository.getActiveTreatment())?.completions).toEqual([]);
    expect(store.getRaw(TREATMENT_ID)).toBe('{not-json');
  });

  it('does not commit in-memory state when save rejects', async () => {
    const store = createInMemoryCompletionOverlayStore({
      onSave: () => {
        throw new Error('save failed');
      },
    });
    const { repository } = createRepository(store);

    await expect(repository.completeAssignment('assignment-1', ON_DATE)).rejects.toThrow(
      'save failed',
    );
    expect((await repository.getActiveTreatment())?.completions).toEqual([]);

    const restarted = createPersistentTreatmentRepository({
      seed: { treatment: seededTreatment() },
      store,
    });
    expect((await restarted.getActiveTreatment())?.completions).toEqual([]);
    expect(store.getRaw(TREATMENT_ID)).toBeUndefined();
  });

  it('does not write the store when seeded empty', async () => {
    const store = createInMemoryCompletionOverlayStore({
      onSave: () => {
        throw new Error('save should not run');
      },
    });
    const repository = createPersistentTreatmentRepository({
      seed: { empty: true },
      store,
    });

    await expect(repository.getActiveTreatment()).resolves.toBeNull();
    await expect(repository.completeAssignment('assignment-1', ON_DATE)).resolves.toEqual({
      status: 'ignored',
      reason: 'no_active_treatment',
    });
  });

  it('isolates completions across stores', async () => {
    const first = createRepository();
    const second = createRepository();

    await first.repository.completeAssignment('assignment-1', ON_DATE);

    expect((await first.repository.getActiveTreatment())?.completions).toHaveLength(1);
    expect((await second.repository.getActiveTreatment())?.completions).toEqual([]);
  });
});
