import { resolveSourceExtension } from '../domain/source-extension';

describe('resolveSourceExtension', () => {
  it('prefers a valid fileName extension over mime type', () => {
    expect(
      resolveSourceExtension({
        sourceUri: 'file:///tmp/cache.bin',
        fileName: 'leg.PNG',
        mimeType: 'image/jpeg',
      }),
    ).toBe('png');
  });

  it('uses mime type when the file name has no allowed extension', () => {
    expect(
      resolveSourceExtension({
        sourceUri: 'file:///tmp/cache',
        fileName: 'IMG_0001',
        mimeType: 'image/heic',
      }),
    ).toBe('heic');
  });

  it('does not invent jpg for an unknown type', () => {
    expect(
      resolveSourceExtension({
        sourceUri: 'file:///tmp/cache',
        fileName: 'note.pdf',
        mimeType: 'application/pdf',
      }),
    ).toBeNull();
  });
});
