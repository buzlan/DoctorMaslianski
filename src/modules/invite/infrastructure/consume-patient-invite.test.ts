import { consumePatientInvite } from './consume-patient-invite';

const input = {
  token: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE',
  privacyAccepted: true,
  pilotConsentAccepted: true,
};

function clientWithInvoke(
  invoke: () => Promise<{ data: unknown; error: Record<string, unknown> | null }>,
) {
  return { functions: { invoke } };
}

function httpError(
  status: number,
  body: unknown,
  options: { jsonThrows?: boolean } = {},
) {
  return {
    message: 'Edge Function returned a non-2xx status code',
    context: {
      status,
      json: options.jsonThrows
        ? async () => {
            throw new Error('body already consumed');
          }
        : async () => body,
    },
  };
}

describe('consumePatientInvite', () => {
  it('maps session tokens without exposing them in the error path', async () => {
    const invoke = jest.fn(async () => ({
      data: { access_token: 'access', refresh_token: 'refresh' },
      error: null,
    }));

    await expect(
      consumePatientInvite(clientWithInvoke(invoke), input),
    ).resolves.toEqual({
      status: 'ok',
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    });
  });

  it('maps a consumed error from a successful-looking function body', async () => {
    const invoke = jest.fn(async () => ({
      data: { error: 'consumed' },
      error: null,
    }));

    await expect(
      consumePatientInvite(clientWithInvoke(invoke), input),
    ).resolves.toEqual({ status: 'error', error: 'consumed' });
  });

  it.each(['invalid', 'expired', 'revoked', 'consumed', 'unusable'] as const)(
    'maps HTTP 400 contract error %s from the response body',
    async (code) => {
      await expect(
        consumePatientInvite(
          clientWithInvoke(async () => ({
            data: null,
            error: httpError(400, { error: code }),
          })),
          input,
        ),
      ).resolves.toEqual({ status: 'error', error: code });
    },
  );

  it('maps HTTP 500 unusable as a temporary service failure', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => ({
          data: null,
          error: httpError(500, { error: 'unusable' }),
        })),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'service' });
  });

  it('maps a 401 gateway body without a contract error as service', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => ({
          data: null,
          error: httpError(401, {
            code: 'UNAUTHORIZED',
            message: 'The apikey header matched no key configured for auth mode(s)',
          }),
        })),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'service' });
  });

  it('maps a fetch failure without an HTTP status as network', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => ({
          data: null,
          error: { name: 'FunctionsFetchError', message: 'Failed to send a request' },
        })),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'network' });
  });

  it('maps an unreadable 400 body as unusable, not network', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => ({
          data: null,
          error: httpError(400, { error: 'consumed' }, { jsonThrows: true }),
        })),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'unusable' });
  });

  it('maps an unreadable 500 body as service, not network', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => ({
          data: null,
          error: httpError(500, { error: 'unusable' }, { jsonThrows: true }),
        })),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'service' });
  });

  it('maps a thrown FunctionsHttpError with a contract body', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => {
          throw httpError(400, { error: 'expired' });
        }),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'expired' });
  });

  it('maps a thrown connectivity failure as network', async () => {
    await expect(
      consumePatientInvite(
        clientWithInvoke(async () => {
          throw new TypeError('Network request failed');
        }),
        input,
      ),
    ).resolves.toEqual({ status: 'error', error: 'network' });
  });
});
