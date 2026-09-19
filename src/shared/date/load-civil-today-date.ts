import { resolveSharedRemotePatientContext } from '@/core/auth/shared-remote-patient-context';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';
import { calendarDateInTimeZone } from '@/shared/date/calendar-date-in-time-zone';
import { toLocalCalendarDate } from '@/shared/date/to-local-calendar-date';
import type { CalendarDate } from '@/modules/treatment/domain';

export async function loadCivilTodayDate(now = new Date()): Promise<CalendarDate> {
  if (shouldUseRemoteRepositories()) {
    const result = await resolveSharedRemotePatientContext();
    if (result.status === 'ready') {
      return calendarDateInTimeZone(now, result.context.clinicTimeZone);
    }
  }

  return toLocalCalendarDate(now);
}
