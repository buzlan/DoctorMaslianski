import { INVITE_TOKEN_PATTERN } from './types';

const KNOWN_HOSTS = new Set(['app.maslianski.by']);

function tokenFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter((part) => part.length > 0);
  if (parts.length >= 2 && parts[0] === 'invite') {
    return parts[1] ?? null;
  }
  if (parts.length === 1 && parts[0] !== undefined) {
    return parts[0];
  }
  return null;
}

export function parseInviteToken(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (INVITE_TOKEN_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('t') ?? url.searchParams.get('token');
    if (fromQuery !== null && INVITE_TOKEN_PATTERN.test(fromQuery)) {
      return fromQuery;
    }

    if (url.protocol === 'doctormaslianski:') {
      const fromPath = tokenFromPath(`${url.host}${url.pathname}`);
      return fromPath !== null && INVITE_TOKEN_PATTERN.test(fromPath) ? fromPath : null;
    }

    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      KNOWN_HOSTS.has(url.hostname)
    ) {
      const fromPath = tokenFromPath(url.pathname);
      return fromPath !== null && INVITE_TOKEN_PATTERN.test(fromPath) ? fromPath : null;
    }
  } catch {
    return null;
  }

  return null;
}
