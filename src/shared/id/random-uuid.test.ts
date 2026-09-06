import { createRandomUuid, isUuidV4 } from './random-uuid';

describe('createRandomUuid', () => {
  it('returns a UUID v4 even when global crypto is missing', () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    try {
      const id = createRandomUuid();
      expect(isUuidV4(id)).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: original,
      });
    }
  });

  it('returns distinct ids', () => {
    expect(createRandomUuid()).not.toBe(createRandomUuid());
  });
});
