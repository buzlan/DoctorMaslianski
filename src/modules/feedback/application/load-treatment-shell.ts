import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

export type TreatmentShell =
  | { status: 'tabs' }
  | { status: 'completed'; patientId: string; treatmentId: string };

export async function loadTreatmentShell(
  repository: TreatmentRepository,
): Promise<TreatmentShell> {
  try {
    const treatment = await repository.getActiveTreatment();
    if (treatment !== null && treatment.status === 'completed') {
      return {
        status: 'completed',
        patientId: treatment.patientId,
        treatmentId: treatment.id,
      };
    }
    return { status: 'tabs' };
  } catch {
    return { status: 'tabs' };
  }
}
