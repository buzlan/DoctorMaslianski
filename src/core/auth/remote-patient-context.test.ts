import {
  createRemotePatientContextResolver,
  type RemoteClinicRow,
  type RemotePatientRow,
} from './remote-patient-context';
import { RetryableRemoteError } from '../sync/remote-error';

const PATIENT: RemotePatientRow = {
  id: 'patient-1',
  clinic_id: 'clinic-1',
  auth_user_id: 'user-a',
  pilot_cohort: 'closed_beta',
};

const CLINIC: RemoteClinicRow = {
  id: 'clinic-1',
  time_zone: 'Europe/Minsk',
  phone: '+375000',
  email: 'clinic@example.test',
  booking_url: 'https://example.test/book',
};

describe('createRemotePatientContextResolver', () => {
  it('returns unauthenticated and clears cache when there is no session', async () => {
    const resolver = createRemotePatientContextResolver({
      readAuth: () => ({ status: 'unauthenticated' }),
      queries: {
        selectOwnPatient: jest.fn(),
        selectClinic: jest.fn(),
      },
    });

    await expect(resolver.resolve()).resolves.toEqual({ status: 'unauthenticated' });
  });

  it('caches a ready context for the same user and invalidates on user change', async () => {
    const selectOwnPatient = jest.fn(async () => PATIENT);
    const selectClinic = jest.fn(async () => CLINIC);
    let userId = 'user-a';

    const resolver = createRemotePatientContextResolver({
      readAuth: () => ({ status: 'authenticated', userId }),
      queries: { selectOwnPatient, selectClinic },
    });

    const first = await resolver.resolve();
    const second = await resolver.resolve();

    expect(first).toEqual(second);
    expect(selectOwnPatient).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({
      status: 'ready',
      context: {
        authUserId: 'user-a',
        patientId: 'patient-1',
        clinicId: 'clinic-1',
        pilotCohort: 'closed_beta',
        clinicTimeZone: 'Europe/Minsk',
        contact: {
          phone: '+375000',
          email: 'clinic@example.test',
          bookingUrl: 'https://example.test/book',
        },
      },
    });

    userId = 'user-b';
    await resolver.resolve();
    expect(selectOwnPatient).toHaveBeenCalledTimes(2);
  });

  it('returns unlinked when RLS-visible patient is missing', async () => {
    const resolver = createRemotePatientContextResolver({
      readAuth: () => ({ status: 'authenticated', userId: 'user-a' }),
      queries: {
        selectOwnPatient: async () => null,
        selectClinic: jest.fn(),
      },
    });

    await expect(resolver.resolve()).resolves.toEqual({
      status: 'unlinked',
      authUserId: 'user-a',
    });
  });

  it('does not cache retryable errors', async () => {
    const selectOwnPatient = jest
      .fn()
      .mockRejectedValueOnce(new RetryableRemoteError('network'))
      .mockResolvedValueOnce(PATIENT);
    const selectClinic = jest.fn(async () => CLINIC);

    const resolver = createRemotePatientContextResolver({
      readAuth: () => ({ status: 'authenticated', userId: 'user-a' }),
      queries: { selectOwnPatient, selectClinic },
    });

    await expect(resolver.resolve()).resolves.toEqual({ status: 'error' });
    await expect(resolver.resolve()).resolves.toMatchObject({ status: 'ready' });
    expect(selectOwnPatient).toHaveBeenCalledTimes(2);
  });
});
