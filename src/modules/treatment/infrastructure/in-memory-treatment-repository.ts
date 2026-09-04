/**
 * In-memory TreatmentRepository for development.
 *
 * Stores an already-created patient Treatment. getActiveTreatment() does
 * not load a clinic action catalog.
 */

import type { Treatment } from '../domain';

import { createDevelopmentTreatment } from './fixtures/pilot-treatment';
import type { TreatmentRepository } from './treatment-repository';

export type InMemoryTreatmentRepositorySeed =
  | { empty: true }
  | { empty?: false; treatment?: Treatment };

class InMemoryTreatmentRepository implements TreatmentRepository {
  constructor(private readonly treatment: Treatment | null) {}

  getActiveTreatment(): Promise<Treatment | null> {
    return Promise.resolve(this.treatment);
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

export const sharedTreatmentRepository = createInMemoryTreatmentRepository();
