import { parseInviteToken } from './parse-invite-token';

describe('parseInviteToken', () => {
  const token = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE';

  it('accepts a raw opaque token', () => {
    expect(parseInviteToken(`  ${token}  `)).toBe(token);
  });

  it('parses the development custom scheme', () => {
    expect(parseInviteToken(`doctormaslianski://invite/${token}`)).toBe(token);
  });

  it('parses the documented future https path', () => {
    expect(parseInviteToken(`https://app.maslianski.by/invite/${token}`)).toBe(
      token,
    );
  });

  it('parses a t query parameter', () => {
    expect(parseInviteToken(`doctormaslianski://invite?t=${token}`)).toBe(token);
  });

  it('rejects medical or identifying payloads', () => {
    expect(parseInviteToken('{"patientId":"abc"}')).toBeNull();
    expect(parseInviteToken('doctormaslianski://invite/not-a-token')).toBeNull();
    expect(parseInviteToken('')).toBeNull();
  });
});
