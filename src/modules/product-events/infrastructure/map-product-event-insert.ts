import type { RemotePatientContext } from '@/core/auth/remote-patient-context';
import type { Database } from '@/core/supabase/database.types';
import type { ProductEvent } from '../domain';

export type ProductEventInsert = Database['public']['Tables']['product_events']['Insert'];

export type MapProductEventInsertResult =
  | { status: 'ready'; row: ProductEventInsert }
  | { status: 'skip_no_cohort' }
  | { status: 'skip_invalid' };

export function mapProductEventInsert(
  event: ProductEvent,
  context: RemotePatientContext,
): MapProductEventInsertResult {
  if (context.pilotCohort === null) {
    return { status: 'skip_no_cohort' };
  }

  const row: ProductEventInsert = {
    name: event.name,
    occurred_at: event.at,
    pilot_cohort: context.pilotCohort,
    patient_id: context.patientId,
  };

  if ('treatmentId' in event && typeof event.treatmentId === 'string') {
    row.treatment_id = event.treatmentId;
  }

  if ('entityId' in event && typeof event.entityId === 'string') {
    row.entity_id = event.entityId;
  }

  if (event.name === 'feedback_submitted') {
    if (
      typeof event.usefulnessScore !== 'number' ||
      typeof event.clarityScore !== 'number'
    ) {
      return { status: 'skip_invalid' };
    }

    row.usefulness_score = event.usefulnessScore;
    row.clarity_score = event.clarityScore;
  }

  return { status: 'ready', row };
}
