import { createDoctorMilestonePhoto } from '../domain';

import { createInMemoryDoctorMilestonePhotoRepository } from './in-memory-doctor-milestone-photo-repository';

const photo = createDoctorMilestonePhoto({
  id: 'photo-1',
  treatmentId: 'treatment-1',
  milestoneId: 'visit-1',
  storageRef: 'visit-1-photo-1.jpg',
});

describe('createInMemoryDoctorMilestonePhotoRepository', () => {
  it('lists photos for a treatment and resolves display URIs asynchronously', async () => {
    const repository = createInMemoryDoctorMilestonePhotoRepository({
      photos: [photo],
      displayUris: { 'photo-1': 'https://example.test/doctor-1.jpg' },
    });

    await expect(repository.listPhotos('treatment-1')).resolves.toEqual([photo]);
    await expect(repository.listPhotos('treatment-2')).resolves.toEqual([]);
    await expect(repository.resolveDisplayUri(photo)).resolves.toBe(
      'https://example.test/doctor-1.jpg',
    );
  });

  it('returns null when a display URI is not configured', async () => {
    const repository = createInMemoryDoctorMilestonePhotoRepository({
      photos: [photo],
    });

    await expect(repository.resolveDisplayUri(photo)).resolves.toBeNull();
  });
});
