import { createDoctorMilestonePhoto } from '../domain';

import { createRemoteDoctorMilestonePhotoRepository } from './remote-doctor-milestone-photo-repository';

const PHOTO = createDoctorMilestonePhoto({
  id: 'photo-1',
  treatmentId: 't1',
  milestoneId: 'm1',
  storageRef: 'clinic/t1/m1/photo-1.jpg',
});

describe('createRemoteDoctorMilestonePhotoRepository', () => {
  it('maps metadata and resolves a short-lived signed URL without persisting it', async () => {
    let nowMs = 1_000_000;
    const signed = jest.fn(async () => 'https://signed.example/tmp');
    const repository = createRemoteDoctorMilestonePhotoRepository({
      gateway: {
        async listPhotos() {
          return [
            {
              id: 'photo-1',
              treatment_id: 't1',
              milestone_id: 'm1',
              storage_path: 'clinic/t1/m1/photo-1.jpg',
            },
          ];
        },
        createSignedUrl: signed,
      },
      readAuthUserId: () => 'user-a',
      now: () => nowMs,
    });

    const photos = await repository.listPhotos('t1');
    expect(photos).toEqual([PHOTO]);
    expect(photos[0]).not.toHaveProperty('displayUri');

    await expect(repository.resolveDisplayUri(photos[0]!)).resolves.toBe(
      'https://signed.example/tmp',
    );
    await expect(repository.resolveDisplayUri(photos[0]!)).resolves.toBe(
      'https://signed.example/tmp',
    );
    expect(signed).toHaveBeenCalledTimes(1);
    expect(signed).toHaveBeenCalledWith('clinic/t1/m1/photo-1.jpg', 300);

    nowMs += 280_000;
    await expect(repository.resolveDisplayUri(photos[0]!)).resolves.toBe(
      'https://signed.example/tmp',
    );
    expect(signed).toHaveBeenCalledTimes(2);
  });

  it('returns null on signed URL failure and does not keep a public URL', async () => {
    const repository = createRemoteDoctorMilestonePhotoRepository({
      gateway: {
        async listPhotos() {
          return [];
        },
        async createSignedUrl() {
          return null;
        },
      },
    });

    await expect(repository.resolveDisplayUri(PHOTO)).resolves.toBeNull();
  });

  it('clears the signed URL cache when the auth user changes', async () => {
    let userId = 'user-a';
    const signed = jest.fn(async (path: string) => `https://signed.example/${userId}/${path}`);
    const repository = createRemoteDoctorMilestonePhotoRepository({
      gateway: {
        async listPhotos() {
          return [];
        },
        createSignedUrl: signed,
      },
      readAuthUserId: () => userId,
      now: () => 1_000_000,
    });

    await expect(repository.resolveDisplayUri(PHOTO)).resolves.toBe(
      'https://signed.example/user-a/clinic/t1/m1/photo-1.jpg',
    );
    userId = 'user-b';
    await expect(repository.resolveDisplayUri(PHOTO)).resolves.toBe(
      'https://signed.example/user-b/clinic/t1/m1/photo-1.jpg',
    );
    expect(signed).toHaveBeenCalledTimes(2);
  });
});
