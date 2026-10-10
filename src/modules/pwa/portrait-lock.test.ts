import { isHandheld, shouldBlockLandscape } from './portrait-lock';

describe('portrait lock', () => {
  it('treats phones as handheld and leaves desktop free to rotate', () => {
    expect(isHandheld('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    expect(isHandheld('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(true);
    expect(isHandheld('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false);
  });

  it('blocks landscape only on a phone', () => {
    expect(shouldBlockLandscape({ web: true, landscape: true, phone: true })).toBe(true);
    expect(shouldBlockLandscape({ web: true, landscape: false, phone: true })).toBe(false);
    expect(shouldBlockLandscape({ web: true, landscape: true, phone: false })).toBe(false);
    expect(shouldBlockLandscape({ web: false, landscape: true, phone: true })).toBe(false);
  });
});
