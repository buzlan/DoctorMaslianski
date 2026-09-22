/**
 * Formats clinic wall-clock appointment time for the Today card.
 * Uses string components only — no device timezone conversion.
 */
const ISO_WALL_CLOCK =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatTodayAppointmentLine(at: string): string | null {
  const match = ISO_WALL_CLOCK.exec(at.trim());
  if (match === null) {
    return null;
  }

  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  if (hour > 23 || minute > 59) {
    return null;
  }

  const monthLabel = MONTHS_RU[month - 1];
  if (monthLabel === undefined) {
    return null;
  }

  return `${day} ${monthLabel} · ${pad2(hour)}:${pad2(minute)}`;
}
