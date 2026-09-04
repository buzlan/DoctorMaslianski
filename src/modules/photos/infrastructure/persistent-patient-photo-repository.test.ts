import { calendarDate, createTreatment } from '@/modules/treatment/domain';

import { PATIENT_PHOTO_MAX_BYTES } from '../domain';

import { createPersistentPatientPhotoRepository } from './persistent-patient-photo-repository';
import { createInMemoryPatientPhotoFileOps } from './in-memory-patient-photo-file-ops';
import { createInMemoryPatientPhotoStore } from './in-memory-patient-photo-store';

const ON_DATE = calendarDate(2026, 8, 19);

function treatment() {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function captured(extension: 'png' | 'jpg' | 'heic' = 'png') {
  return {
    sourceUri: `file:///cache/source.${extension}`,
    fileName: `leg.${extension}`,
    mimeType: extension === 'png' ? 'image/png' : extension === 'heic' ? 'image/heic' : 'image/jpeg',
  };
}

describe('createPersistentPatientPhotoRepository', () => {
  it('does not copy a file when the daily cap is already reached', async () => {
    const fileOps = createInMemoryPatientPhotoFileOps();
    const repository = createPersistentPatientPhotoRepository({
      store: createInMemoryPatientPhotoStore(),
      fileOps,
    });

    await repository.recordPhoto(treatment(), ON_DATE, captured('jpg'));
    await repository.recordPhoto(treatment(), ON_DATE, captured('jpg'));
    await repository.recordPhoto(treatment(), ON_DATE, captured('jpg'));
    expect(fileOps.copied).toHaveLength(3);

    const fourth = await repository.recordPhoto(treatment(), ON_DATE, captured('jpg'));
    expect(fourth).toEqual({ status: 'ignored', reason: 'daily_cap_reached' });
    expect(fileOps.copied).toHaveLength(3);
    expect(fileOps.removed).toEqual([]);
  });

  it('keeps the source extension instead of renaming to jpg', async () => {
    const fileOps = createInMemoryPatientPhotoFileOps();
    const repository = createPersistentPatientPhotoRepository({
      store: createInMemoryPatientPhotoStore(),
      fileOps,
      createId: () => 'photo-id',
    });

    const png = await repository.recordPhoto(treatment(), ON_DATE, captured('png'));

    expect(png).toMatchObject({
      status: 'recorded',
      photo: { id: 'photo-id', slot: 1 },
    });
    expect(fileOps.copied[0]).toMatch(/\.png$/);
  });

  it('ignores files over the storage size limit', async () => {
    const repository = createPersistentPatientPhotoRepository({
      store: createInMemoryPatientPhotoStore(),
      fileOps: createInMemoryPatientPhotoFileOps({ size: PATIENT_PHOTO_MAX_BYTES + 1 }),
    });

    await expect(repository.recordPhoto(treatment(), ON_DATE, captured('png'))).resolves.toEqual({
      status: 'ignored',
      reason: 'file_too_large',
    });
  });

  it('removes the copied file when metadata save fails', async () => {
    const fileOps = createInMemoryPatientPhotoFileOps();
    const store = createInMemoryPatientPhotoStore();
    const repository = createPersistentPatientPhotoRepository({
      store: {
        load: (treatmentId) => store.load(treatmentId),
        save() {
          return Promise.reject(new Error('save failed'));
        },
      },
      fileOps,
    });

    await expect(repository.recordPhoto(treatment(), ON_DATE, captured('png'))).rejects.toThrow(
      'save failed',
    );
    expect(fileOps.copied).toHaveLength(1);
    expect(fileOps.removed).toEqual(fileOps.copied);
    expect(await repository.listPhotos('treatment-1')).toEqual([]);
  });
});
