import { calendarDate } from '@/modules/treatment/domain';

import { patientPhotoStoragePath } from './patient-photo-storage-path';

const ON_DATE = calendarDate(2026, 8, 9);

describe('patientPhotoStoragePath', () => {
  it('builds the backend contract path with a zero-padded civil date', () => {
    expect(
      patientPhotoStoragePath({
        clinicId: 'clinic-1',
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
        submittedOn: ON_DATE,
        photoId: 'photo-1',
        extension: 'jpg',
      }),
    ).toBe('clinic-1/patient-1/treatment-1/2026-08-09/photo-1.jpg');
  });

  it('rejects URLs, parent segments, and absolute parts', () => {
    const base = {
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      submittedOn: ON_DATE,
      photoId: 'photo-1',
      extension: 'jpg',
    };

    expect(patientPhotoStoragePath({ ...base, photoId: 'https://example.test/x' })).toBeNull();
    expect(patientPhotoStoragePath({ ...base, clinicId: '..' })).toBeNull();
    expect(patientPhotoStoragePath({ ...base, patientId: '/patient' })).toBeNull();
  });
});
