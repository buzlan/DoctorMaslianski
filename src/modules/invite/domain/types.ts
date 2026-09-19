export const PILOT_CONSENT_DOCUMENT_VERSION = 'pilot-v0';

export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export type InviteConsumeError =
  | 'invalid'
  | 'expired'
  | 'revoked'
  | 'consumed'
  | 'unusable'
  | 'service'
  | 'network';

export type InviteSessionTokens = {
  accessToken: string;
  refreshToken: string;
};
