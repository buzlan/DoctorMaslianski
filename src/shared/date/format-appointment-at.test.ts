import { formatAppointmentAt } from './format-appointment-at';

describe('formatAppointmentAt', () => {
  it('formats wall-clock components from a Zulu ISO string', () => {
    expect(formatAppointmentAt('2026-08-20T09:00:00.000Z')).toBe('20.08.2026, 09:00');
  });

  it('keeps the authored wall-clock when an offset is present', () => {
    expect(formatAppointmentAt('2026-08-20T09:00:00+03:00')).toBe('20.08.2026, 09:00');
    expect(formatAppointmentAt('2026-08-20T09:00:00-05:00')).toBe('20.08.2026, 09:00');
  });

  it('does not convert Zulu 09:00 to a different local hour', () => {
    const formatted = formatAppointmentAt('2026-08-20T09:00:00.000Z');
    expect(formatted).toBe('20.08.2026, 09:00');
    expect(formatted).not.toContain('12:00');
    expect(formatted).not.toContain('06:00');
  });

  it('returns null for missing, invalid, or unparseable values', () => {
    expect(formatAppointmentAt('')).toBeNull();
    expect(formatAppointmentAt('not-a-date')).toBeNull();
    expect(formatAppointmentAt('2026-08-20')).toBeNull();
    expect(formatAppointmentAt('2026-13-40T25:99:00Z')).toBeNull();
  });
});
