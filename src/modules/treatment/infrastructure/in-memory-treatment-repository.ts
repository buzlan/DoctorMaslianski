/**
 * In-memory TreatmentRepository test double.
 *
 * Stores an already-created patient Treatment. Completions are an in-memory
 * overlay and are lost when the process exits. The app singleton is the
 * persistent repository in shared-treatment-repository.ts.
 */

import {
  clearAssignmentCompletion,
  recordAssignmentCompletion,
  type CalendarDate,
  type Treatment,
} from '../domain';

import { createDevelopmentTreatment } from './fixtures/pilot-treatment';
import type {
  CompleteAssignmentResult,
  TreatmentRepository,
  UncompleteAssignmentResult,
} from './treatment-repository';

export type InMemoryTreatmentRepositorySeed =
  | { empty: true }
  | { empty?: false; treatment?: Treatment };

class InMemoryTreatmentRepository implements TreatmentRepository {
  constructor(private treatment: Treatment | null) {}

  getActiveTreatment(): Promise<Treatment | null> {
    return Promise.resolve(this.treatment);
  }

  completeAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<CompleteAssignmentResult> {
    if (this.treatment === null) {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    }

    const result = recordAssignmentCompletion(this.treatment, assignmentId, onDate);
    if (result.status === 'ignored') {
      return Promise.resolve(result);
    }

    this.treatment = result.treatment;

    return Promise.resolve({
      status: 'recorded',
      completion: result.completion,
      alreadyPresent: result.alreadyPresent,
      patientId: this.treatment.patientId,
      treatmentId: this.treatment.id,
    });
  }

  uncompleteAssignment(
    assignmentId: string,
    onDate: CalendarDate,
  ): Promise<UncompleteAssignmentResult> {
    if (this.treatment === null) {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    }

    const result = clearAssignmentCompletion(this.treatment, assignmentId, onDate);
    if (result.status === 'ignored') {
      return Promise.resolve(result);
    }

    this.treatment = result.treatment;

    return Promise.resolve({
      status: 'cleared',
      alreadyAbsent: result.alreadyAbsent,
    });
  }
}

export function createInMemoryTreatmentRepository(
  seed: InMemoryTreatmentRepositorySeed = {},
): TreatmentRepository {
  if (seed.empty === true) {
    return new InMemoryTreatmentRepository(null);
  }

  return new InMemoryTreatmentRepository(seed.treatment ?? createDevelopmentTreatment());
}
