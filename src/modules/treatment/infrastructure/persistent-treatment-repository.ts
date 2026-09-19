/**
 * TreatmentRepository that persists the ActionCompletion overlay locally.
 *
 * Plan-of-care fields (periods, assignments, milestones, appointments) come
 * from the injected seed / development fixture. Completions are loaded from
 * CompletionOverlayStore on first access and written after a successful save.
 */

import {
  clearAssignmentCompletion,
  createTreatment,
  recordAssignmentCompletion,
  type ActionCompletion,
  type CalendarDate,
  type Treatment,
} from '../domain';

import type { CompletionOverlayStore } from './completion-overlay-store';
import { createDevelopmentTreatment } from './fixtures/pilot-treatment';
import type { InMemoryTreatmentRepositorySeed } from './in-memory-treatment-repository';
import type {
  CompleteAssignmentResult,
  TreatmentRepository,
  UncompleteAssignmentResult,
} from './treatment-repository';

export type PersistentTreatmentRepositoryOptions = {
  seed?: InMemoryTreatmentRepositorySeed;
  store: CompletionOverlayStore;
};

function planFromSeed(seed: InMemoryTreatmentRepositorySeed = {}): Treatment | null {
  if (seed.empty === true) {
    return null;
  }

  return seed.treatment ?? createDevelopmentTreatment();
}

function withCompletionOverlay(
  plan: Treatment,
  completions: readonly ActionCompletion[],
): Treatment {
  return createTreatment({
    id: plan.id,
    patientId: plan.patientId,
    status: plan.status,
    periods: plan.periods,
    milestones: plan.milestones,
    assignments: plan.assignments,
    appointments: plan.appointments,
    completions,
  });
}

class PersistentTreatmentRepository implements TreatmentRepository {
  private readonly plan: Treatment | null;
  private readonly store: CompletionOverlayStore;
  private treatment: Treatment | null = null;
  private hydrated = false;
  private queue: Promise<void> = Promise.resolve();

  constructor(plan: Treatment | null, store: CompletionOverlayStore) {
    this.plan = plan;
    this.store = store;
  }

  getActiveTreatment(): Promise<Treatment | null> {
    return this.enqueue(async () => {
      await this.hydrate();
      return this.treatment;
    });
  }

  completeAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<CompleteAssignmentResult> {
    return this.enqueue(async () => {
      await this.hydrate();

      if (this.treatment === null) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      const result = recordAssignmentCompletion(this.treatment, assignmentId, onDate);
      if (result.status === 'ignored') {
        return result;
      }

      if (!result.alreadyPresent) {
        await this.store.save(this.treatment.id, result.treatment.completions);
        this.treatment = result.treatment;
      }

      return {
        status: 'recorded',
        completion: result.completion,
        alreadyPresent: result.alreadyPresent,
        patientId: this.treatment.patientId,
        treatmentId: this.treatment.id,
      };
    });
  }

  uncompleteAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<UncompleteAssignmentResult> {
    return this.enqueue(async () => {
      await this.hydrate();

      if (this.treatment === null) {
        return { status: 'ignored', reason: 'no_active_treatment' };
      }

      const result = clearAssignmentCompletion(this.treatment, assignmentId, onDate);
      if (result.status === 'ignored') {
        return result;
      }

      if (!result.alreadyAbsent) {
        await this.store.save(this.treatment.id, result.treatment.completions);
        this.treatment = result.treatment;
      }

      return {
        status: 'cleared',
        alreadyAbsent: result.alreadyAbsent,
      };
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async hydrate(): Promise<void> {
    if (this.hydrated) {
      return;
    }

    if (this.plan === null) {
      this.treatment = null;
      this.hydrated = true;
      return;
    }

    let overlay: readonly ActionCompletion[] = [];
    try {
      overlay = await this.store.load(this.plan.id);
    } catch {
      overlay = [];
    }

    this.treatment = withCompletionOverlay(this.plan, overlay);
    this.hydrated = true;
  }
}

export function createPersistentTreatmentRepository(
  options: PersistentTreatmentRepositoryOptions,
): TreatmentRepository {
  return new PersistentTreatmentRepository(planFromSeed(options.seed), options.store);
}
