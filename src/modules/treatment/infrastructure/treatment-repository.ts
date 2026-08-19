import type { Treatment } from '../domain';

export type TreatmentRepository = {
  getActiveTreatment(): Promise<Treatment | null>;
};
