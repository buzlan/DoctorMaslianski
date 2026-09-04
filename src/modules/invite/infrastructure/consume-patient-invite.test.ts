import { consumePatientInvite } from './consume-patient-invite';

describe('consumePatientInvite', () => {
  it('maps session tokens without exposing them in the error path', async () => {
    const invoke = jest.fn(async () => ({
      data: { access_token: 'access', refresh_token: 'refresh' },
      error: null,
    }));

    await expect(
      consumePatientInvite(
        { functions: { invoke } },
        {
          token: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE',
          privacyAccepted: true,
          pilotConsentAccepted: true,
        },
      ),
    ).resolves.toEqual({
      status: 'ok',
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    });
  });

  it('maps a consumed error from the function body', async () => {
    const invoke = jest.fn(async () => ({
      data: { error: 'consumed' },
      error: null,
    }));

    await expect(
      consumePatientInvite(
        { functions: { invoke } },
        {
          token: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE',
          privacyAccepted: true,
          pilotConsentAccepted: true,
        },
      ),
    ).resolves.toEqual({ status: 'error', error: 'consumed' });
  });
});
