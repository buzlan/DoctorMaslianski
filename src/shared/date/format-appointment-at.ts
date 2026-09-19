/**
 * Formats a clinic-authored ISO datetime as wall-clock DD.MM.YYYY, HH:MM.
 *
 * Uses the date/time components from the string as written. Does not convert
 * through the device timezone. Invalid or unparseable values return null.
 */
const ISO_WALL_CLOCK =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isValidWallClock(
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number | undefined,
): boolean {
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }
  if (hour > 23 || minute > 59) {
    return false;
  }
  if (second !== undefined && second > 59) {
    return false;
  }
  return true;
}

export function formatAppointmentAt(at: string): string | null {
  const match = ISO_WALL_CLOCK.exec(at.trim());
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? undefined : Number(match[6]);

  if (!isValidWallClock(month, day, hour, minute, second)) {
    return null;
  }

  return `${pad2(day)}.${pad2(month)}.${year}, ${pad2(hour)}:${pad2(minute)}`;
}
