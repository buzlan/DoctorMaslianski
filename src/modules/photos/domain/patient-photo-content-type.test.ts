import { contentTypeForExtension } from './patient-photo-content-type';

describe('contentTypeForExtension', () => {
  it('maps allowed extensions to canonical MIME types', () => {
    expect(contentTypeForExtension('jpg')).toBe('image/jpeg');
    expect(contentTypeForExtension('jpeg')).toBe('image/jpeg');
    expect(contentTypeForExtension('png')).toBe('image/png');
    expect(contentTypeForExtension('heic')).toBe('image/heic');
    expect(contentTypeForExtension('heif')).toBe('image/heif');
    expect(contentTypeForExtension('webp')).toBe('image/webp');
  });

  it('rejects unknown extensions', () => {
    expect(contentTypeForExtension('gif')).toBeNull();
    expect(contentTypeForExtension('')).toBeNull();
  });
});
