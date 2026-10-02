export const HANDOFF_COOKIE_NAME = 'pwa_handoff';
export const HANDOFF_COOKIE_MAX_AGE_SECONDS = 600;
export const HANDOFF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function handoffCookieAssignment(
  token: string,
  maxAgeSeconds = HANDOFF_COOKIE_MAX_AGE_SECONDS,
): string {
  return `${HANDOFF_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; Secure; SameSite=Strict`;
}

export function clearHandoffCookieAssignment(): string {
  return `${HANDOFF_COOKIE_NAME}=; Max-Age=0; Path=/; Secure; SameSite=Strict`;
}

export function readHandoffCookie(cookieHeader: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const name = trimmed.slice(0, separator);
    if (name !== HANDOFF_COOKIE_NAME) {
      continue;
    }
    const raw = trimmed.slice(separator + 1);
    let token = raw;
    try {
      token = decodeURIComponent(raw);
    } catch {
      token = raw;
    }
    if (!HANDOFF_TOKEN_PATTERN.test(token)) {
      return null;
    }
    return token;
  }
  return null;
}

export function readBrowserHandoffCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return readHandoffCookie(document.cookie);
}

export function writeBrowserHandoffCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = handoffCookieAssignment(token);
}

export function clearBrowserHandoffCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = clearHandoffCookieAssignment();
}
