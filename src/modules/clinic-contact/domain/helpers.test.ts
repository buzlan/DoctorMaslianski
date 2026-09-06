import { clinicContactChannels, hasClinicContactChannel } from './helpers';

describe('clinicContactChannels', () => {
  it('returns no channels for an empty contact', () => {
    expect(clinicContactChannels({})).toEqual([]);
    expect(hasClinicContactChannel({})).toBe(false);
  });

  it('builds an allowlisted tel href from a phone number', () => {
    expect(clinicContactChannels({ phone: '+375 17 000-00-00' })).toEqual([
      { kind: 'phone', href: 'tel:+375170000000' },
    ]);
  });

  it('builds an allowlisted mailto href from an email', () => {
    expect(clinicContactChannels({ email: 'clinic@example.com' })).toEqual([
      { kind: 'email', href: 'mailto:clinic@example.com' },
    ]);
  });

  it('allows https and http booking URLs only', () => {
    expect(clinicContactChannels({ bookingUrl: 'https://clinic.example/book' })).toEqual([
      { kind: 'booking', href: 'https://clinic.example/book' },
    ]);
    expect(clinicContactChannels({ bookingUrl: 'http://clinic.example/book' })).toEqual([
      { kind: 'booking', href: 'http://clinic.example/book' },
    ]);
  });

  it('rejects non-allowlisted schemes on every field', () => {
    expect(
      clinicContactChannels({
        phone: 'javascript:alert(1)',
        email: 'javascript:alert(1)',
        bookingUrl: 'intent://scan',
      }),
    ).toEqual([]);
    expect(clinicContactChannels({ bookingUrl: 'ftp://clinic.example/book' })).toEqual([]);
    expect(clinicContactChannels({ phone: 'sms:+375170000000' })).toEqual([]);
  });

  it('enables each present valid field independently', () => {
    const channels = clinicContactChannels({
      phone: '+375170000000',
      email: 'clinic@example.com',
      bookingUrl: 'https://clinic.example/book',
    });

    expect(channels.map((channel) => channel.kind)).toEqual(['phone', 'email', 'booking']);
    expect(hasClinicContactChannel({ phone: '+375170000000' })).toBe(true);
  });
});
