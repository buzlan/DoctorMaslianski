import { createWebPatientPhotoFileOps } from './expo-patient-photo-file-ops.web';

describe('createWebPatientPhotoFileOps', () => {
  it('keeps a blob url for preview upload and drops it on remove', async () => {
    const blob = new Blob([Uint8Array.from([1, 2, 3, 4])], { type: 'image/jpeg' });
    const revoked: string[] = [];
    const ops = createWebPatientPhotoFileOps({
      readBlob: async () => blob,
      createObjectUrl: () => 'blob:preview',
      revokeObjectUrl(url) {
        revoked.push(url);
      },
    });

    await expect(ops.getSize('blob:source')).resolves.toBe(4);
    await ops.copy('blob:source', 'treatment-1', 'photo.jpg');

    expect(ops.fileUri('treatment-1', 'photo.jpg')).toBe('blob:preview');
    await expect(ops.getSize('blob:preview')).resolves.toBe(4);

    await ops.remove('treatment-1', 'photo.jpg');

    expect(ops.fileUri('treatment-1', 'photo.jpg')).toBe('');
    expect(revoked).toEqual(['blob:preview']);
  });
});
