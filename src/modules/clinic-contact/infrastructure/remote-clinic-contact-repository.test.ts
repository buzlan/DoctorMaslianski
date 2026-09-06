import { createRemoteClinicContactRepository } from './remote-clinic-contact-repository';

describe('createRemoteClinicContactRepository', () => {
  it('returns clinic contact from RemotePatientContext', async () => {
    const repository = createRemoteClinicContactRepository({
      resolveContext: async () => ({
        status: 'ready',
        context: {
          authUserId: 'user-a',
          patientId: 'p1',
          clinicId: 'c1',
          pilotCohort: 'closed_beta',
          clinicTimeZone: 'Europe/Minsk',
          contact: { phone: '+37500', email: 'a@example.test' },
        },
      }),
    });

    await expect(repository.getContact()).resolves.toEqual({
      phone: '+37500',
      email: 'a@example.test',
    });
  });
});
