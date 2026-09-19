import { classifyStorageUploadError } from './classify-storage-upload-error';

describe('classifyStorageUploadError', () => {
  it('treats a missing error as success', () => {
    expect(classifyStorageUploadError(null)).toBe('acked');
  });

  it('treats only the object-already-exists condition as duplicate', () => {
    expect(
      classifyStorageUploadError({
        statusCode: '409',
        error: 'Duplicate',
        message: 'The resource already exists',
      }),
    ).toBe('duplicate');
    expect(
      classifyStorageUploadError({
        message: 'The resource already exists',
      }),
    ).toBe('duplicate');
  });

  it('does not treat a generic 409 or 400 as duplicate success', () => {
    expect(
      classifyStorageUploadError({
        statusCode: '409',
        message: 'Conflict',
      }),
    ).toBe('retry');
    expect(
      classifyStorageUploadError({
        statusCode: '400',
        message: 'Invalid key',
      }),
    ).toBe('integrity');
  });

  it('keeps auth and server errors pending', () => {
    expect(classifyStorageUploadError({ statusCode: '401', message: 'Invalid JWT' })).toBe(
      'retry',
    );
    expect(classifyStorageUploadError({ statusCode: '403', message: 'Access denied' })).toBe(
      'retry',
    );
    expect(classifyStorageUploadError({ statusCode: '503', message: 'unavailable' })).toBe(
      'retry',
    );
  });

  it('fails permanent validation errors', () => {
    expect(classifyStorageUploadError({ status: 413, message: 'Payload too large' })).toBe(
      'integrity',
    );
  });
});
