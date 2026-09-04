import { createRemoteDoctorMilestonePhotoRepository } from './remote-doctor-milestone-photo-repository';

describe('createRemoteDoctorMilestonePhotoRepository', () => {
  it('maps metadata and never resolves a display URI in TASK-031', async () => {
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
      },
    });

    const photos = await repository.listPhotos('t1');
    expect(photos).toEqual([
      {
        id: 'photo-1',
        treatmentId: 't1',
        milestoneId: 'm1',
        storageRef: 'clinic/t1/m1/photo-1.jpg',
      },
    ]);
    await expect(repository.resolveDisplayUri(photos[0]!)).resolves.toBeNull();
  });
});
