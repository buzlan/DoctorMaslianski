import { RetryableRemoteError } from '../sync/remote-error';
import type { AppSupabaseClient } from '../supabase/client';
import { getSharedSupabaseClient } from '../supabase/client';

import {
  createRemotePatientContextResolver,
  type RemoteClinicRow,
  type RemotePatientContextQueries,
  type RemotePatientContextResolver,
  type RemotePatientRow,
} from './remote-patient-context';

function createSupabasePatientContextQueries(
  client: AppSupabaseClient,
): RemotePatientContextQueries {
  return {
    async selectOwnPatient() {
      const { data, error } = await client
        .from('patients')
        .select('id, clinic_id, auth_user_id, pilot_cohort')
        .maybeSingle();

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      if (data === null) {
        return null;
      }

      return data as RemotePatientRow;
    },
    async selectClinic(clinicId) {
      const { data, error } = await client
        .from('clinics')
        .select('id, time_zone, phone, email, booking_url')
        .eq('id', clinicId)
        .maybeSingle();

      if (error) {
        throw new RetryableRemoteError(error.message);
      }

      if (data === null) {
        return null;
      }

      return data as RemoteClinicRow;
    },
  };
}

let sharedResolver: RemotePatientContextResolver | null = null;

export function getSharedRemotePatientContextResolver(): RemotePatientContextResolver | null {
  const client = getSharedSupabaseClient();
  if (client === null) {
    return null;
  }

  if (sharedResolver === null) {
    sharedResolver = createRemotePatientContextResolver({
      queries: createSupabasePatientContextQueries(client),
    });
  }

  return sharedResolver;
}

export function resetSharedRemotePatientContextResolverForTests(): void {
  sharedResolver = null;
}

export async function resolveSharedRemotePatientContext() {
  const resolver = getSharedRemotePatientContextResolver();
  if (resolver === null) {
    return { status: 'unauthenticated' as const };
  }

  return resolver.resolve();
}
