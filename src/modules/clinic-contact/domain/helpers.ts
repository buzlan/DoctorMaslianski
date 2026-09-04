import type { ClinicContact, ClinicContactChannel } from './types';

function hasForeignScheme(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value);
}

function toTelHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (hasForeignScheme(trimmed) && !trimmed.toLowerCase().startsWith('tel:')) {
    return null;
  }

  const number = trimmed.toLowerCase().startsWith('tel:') ? trimmed.slice(4) : trimmed;
  if (!/^[+\d][\d\s().-]*$/.test(number)) {
    return null;
  }

  const digits = number.replace(/[^\d+]/g, '');
  if (digits.replace(/\+/g, '').length === 0) {
    return null;
  }

  return `tel:${digits}`;
}

function toMailtoHref(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const address = trimmed.toLowerCase().startsWith('mailto:') ? trimmed.slice(7) : trimmed;
  if (hasForeignScheme(address)) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return null;
  }

  return `mailto:${address}`;
}

function toBookingHref(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function clinicContactChannels(contact: ClinicContact): readonly ClinicContactChannel[] {
  const channels: ClinicContactChannel[] = [];

  if (contact.phone !== undefined) {
    const href = toTelHref(contact.phone);
    if (href !== null) {
      channels.push({ kind: 'phone', href });
    }
  }

  if (contact.email !== undefined) {
    const href = toMailtoHref(contact.email);
    if (href !== null) {
      channels.push({ kind: 'email', href });
    }
  }

  if (contact.bookingUrl !== undefined) {
    const href = toBookingHref(contact.bookingUrl);
    if (href !== null) {
      channels.push({ kind: 'booking', href });
    }
  }

  return channels;
}

export function hasClinicContactChannel(contact: ClinicContact): boolean {
  return clinicContactChannels(contact).length > 0;
}
