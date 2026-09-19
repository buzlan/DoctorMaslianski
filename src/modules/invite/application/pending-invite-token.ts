let pendingToken: string | null = null;

export function setPendingInviteToken(token: string | null): void {
  pendingToken = token;
}

export function getPendingInviteToken(): string | null {
  return pendingToken;
}

export function clearPendingInviteToken(): void {
  pendingToken = null;
}
