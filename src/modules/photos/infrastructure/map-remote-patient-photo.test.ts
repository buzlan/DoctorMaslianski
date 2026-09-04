import { calendarDate } from '@/modules/treatment/domain';

import { applyPatientPhotoOutbox, mapRemotePatientPhoto } from './map-remote-patient-photo';

const ON_DATE = calendarDate(2026, 8, 9);

describe('mapRemotePatientPhoto', () => {
  it('maps metadata without storage URLs', () => {
    const photo = mapRemotePatientPhoto({
      id: 'photo-1',
      treatment_id: 't1',
      patient_id: 'p1',
      submitted_on: '2026-08-09',
      slot: 2,
    });

    expect(photo).toEqual({
      id: 'photo-1',
      treatmentId: 't1',
      patientId: 'p1',
      submittedOn: ON_DATE,
      slot: 2,
    });
    expect(photo).not.toHaveProperty('localFileRef');
    expect(photo).not.toHaveProperty('storagePath');
  });

  it('skips an invalid slot', () => {
    expect(
      mapRemotePatientPhoto({
        id: 'photo-1',
        treatment_id: 't1',
        patient_id: 'p1',
        submitted_on: '2026-08-09',
        slot: 4,
      }),
    ).toBeNull();
  });
});

describe('applyPatientPhotoOutbox', () => {
  it('overlays only the current user pending photos and skips duplicates', () => {
    const photos = applyPatientPhotoOutbox(
      [
        {
          id: 'existing',
          treatmentId: 't1',
          patientId: 'p1',
          submittedOn: ON_DATE,
          slot: 1,
        },
      ],
      [
        {
          id: 'outbox-1',
          authUserId: 'user-a',
          treatmentId: 't1',
          createdAt: '2026-08-09T10:00:00.000Z',
          payload: {
            photoId: 'pending',
            treatmentId: 't1',
            patientId: 'p1',
            submittedOn: '2026-08-09',
            slot: 2,
            contentType: 'image/jpeg',
            extension: 'jpg',
            localFileRef: 'pending.jpg',
          },
        },
        {
          id: 'outbox-2',
          authUserId: 'user-b',
          treatmentId: 't1',
          createdAt: '2026-08-09T10:00:01.000Z',
          payload: {
            photoId: 'other-user',
            treatmentId: 't1',
            patientId: 'p2',
            submittedOn: '2026-08-09',
            slot: 3,
            contentType: 'image/jpeg',
            extension: 'jpg',
            localFileRef: 'other.jpg',
          },
        },
        {
          id: 'outbox-3',
          authUserId: 'user-a',
          treatmentId: 't1',
          createdAt: '2026-08-09T10:00:02.000Z',
          payload: {
            photoId: 'existing',
            treatmentId: 't1',
            patientId: 'p1',
            submittedOn: '2026-08-09',
            slot: 1,
            contentType: 'image/jpeg',
            extension: 'jpg',
            localFileRef: 'existing.jpg',
          },
        },
      ],
      'user-a',
      't1',
    );

    expect(photos.map((photo) => photo.id)).toEqual(['existing', 'pending']);
  });
});
