import type { CalendarDate } from '@/modules/treatment/domain';
import { formatCivilDate } from '@/shared/date/civil-date';

function isSafePathPart(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !value.includes('://') &&
    !value.includes('..') &&
    !value.includes('/') &&
    !value.includes('\\')
  );
}

export function patientPhotoStoragePath(input: {
  clinicId: string;
  patientId: string;
  treatmentId: string;
  submittedOn: CalendarDate;
  photoId: string;
  extension: string;
}): string | null {
  if (
    !isSafePathPart(input.clinicId) ||
    !isSafePathPart(input.patientId) ||
    !isSafePathPart(input.treatmentId) ||
    !isSafePathPart(input.photoId) ||
    !isSafePathPart(input.extension)
  ) {
    return null;
  }

  return `${input.clinicId}/${input.patientId}/${input.treatmentId}/${formatCivilDate(input.submittedOn)}/${input.photoId}.${input.extension}`;
}
