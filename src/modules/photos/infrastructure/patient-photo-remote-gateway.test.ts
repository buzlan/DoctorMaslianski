import * as FileSystem from 'expo-file-system/legacy';

import { RetryableRemoteError } from '@/core/sync/remote-error';

import { readLocalFileArrayBuffer } from './patient-photo-remote-gateway';

describe('readLocalFileArrayBuffer', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.mocked(FileSystem.readAsStringAsync).mockReset();
    jest.mocked(FileSystem.readAsStringAsync).mockRejectedValue(new Error('missing'));
  });

  it('returns an ArrayBuffer from fetch', async () => {
    const bytes = new ArrayBuffer(4);
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => bytes,
    })) as unknown as typeof fetch;

    await expect(readLocalFileArrayBuffer('file:///documents/a.jpg')).resolves.toBe(bytes);
    expect(globalThis.fetch).toHaveBeenCalledWith('file:///documents/a.jpg');
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  it('falls back to FileSystem when fetch cannot read a local file', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('AQIDBA==');

    const bytes = await readLocalFileArrayBuffer('file:///documents/a.jpg');
    expect(Array.from(new Uint8Array(bytes))).toEqual([1, 2, 3, 4]);
  });

  it('throws a retryable error when the file cannot be read', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    await expect(readLocalFileArrayBuffer('file:///missing.jpg')).rejects.toBeInstanceOf(
      RetryableRemoteError,
    );
  });
});
