import type { PilotCohort } from '@/modules/treatment/domain';
import type { ClinicContact } from '@/modules/clinic-contact/domain';

import {
  getAuthSessionSnapshot,
  type AuthSessionState,
} from './auth-session';
import { RetryableRemoteError } from '../sync/remote-error';

export type RemotePatientContext = {
  authUserId: string;
  patientId: string;
  clinicId: string;
  pilotCohort: PilotCohort | null;
  clinicTimeZone: string;
  contact: ClinicContact;
};

export type RemotePatientContextResult =
  | { status: 'ready'; context: RemotePatientContext }
  | { status: 'unlinked'; authUserId: string }
  | { status: 'unauthenticated' }
  | { status: 'error' };

export type RemotePatientRow = {
  id: string;
  clinic_id: string;
  auth_user_id: string | null;
  pilot_cohort: PilotCohort | null;
};

export type RemoteClinicRow = {
  id: string;
  time_zone: string;
  phone: string | null;
  email: string | null;
  booking_url: string | null;
};

export type RemotePatientContextQueries = {
  selectOwnPatient(): Promise<RemotePatientRow | null>;
  selectClinic(clinicId: string): Promise<RemoteClinicRow | null>;
};

const PILOT_COHORTS = new Set<PilotCohort>([
  'internal_dry_run',
  'closed_beta',
  'clinic_pilot',
]);

export type RemotePatientContextResolver = {
  resolve(): Promise<RemotePatientContextResult>;
  invalidate(): void;
};

export function createRemotePatientContextResolver(options: {
  queries: RemotePatientContextQueries;
  readAuth?: () => AuthSessionState;
}): RemotePatientContextResolver {
  const readAuth = options.readAuth ?? getAuthSessionSnapshot;
  let cached: { userId: string; result: RemotePatientContextResult } | null = null;

  return {
    invalidate() {
      cached = null;
    },
    async resolve() {
      const auth = readAuth();
      if (auth.status !== 'authenticated') {
        cached = null;
        return { status: 'unauthenticated' };
      }

      if (cached !== null && cached.userId === auth.userId) {
        return cached.result;
      }

      cached = null;

      try {
        const patient = await options.queries.selectOwnPatient();
        if (patient === null) {
          const result: RemotePatientContextResult = {
            status: 'unlinked',
            authUserId: auth.userId,
          };
          cached = { userId: auth.userId, result };
          return result;
        }

        const clinic = await options.queries.selectClinic(patient.clinic_id);
        if (clinic === null) {
          return { status: 'error' };
        }

        const result: RemotePatientContextResult = {
          status: 'ready',
          context: {
            authUserId: auth.userId,
            patientId: patient.id,
            clinicId: patient.clinic_id,
            pilotCohort: parseCohort(patient.pilot_cohort),
            clinicTimeZone: clinic.time_zone,
            contact: mapContact(clinic),
          },
        };
        cached = { userId: auth.userId, result };
        return result;
      } catch (error) {
        if (error instanceof RetryableRemoteError) {
          return { status: 'error' };
        }

        return { status: 'error' };
      }
    },
  };
}

function parseCohort(value: PilotCohort | null): PilotCohort | null {
  if (value === null) {
    return null;
  }

  return PILOT_COHORTS.has(value) ? value : null;
}

function mapContact(clinic: RemoteClinicRow): ClinicContact {
  const contact: ClinicContact = {};

  if (clinic.phone !== null && clinic.phone.length > 0) {
    contact.phone = clinic.phone;
  }

  if (clinic.email !== null && clinic.email.length > 0) {
    contact.email = clinic.email;
  }

  if (clinic.booking_url !== null && clinic.booking_url.length > 0) {
    contact.bookingUrl = clinic.booking_url;
  }

  return contact;
}
