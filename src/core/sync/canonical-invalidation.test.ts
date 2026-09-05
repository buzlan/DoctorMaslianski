import {
  invalidateFromHint,
  resetCanonicalInvalidationForTests,
  subscribeCanonicalInvalidation,
  targetsForHint,
} from './canonical-invalidation';

describe('canonical invalidation', () => {
  afterEach(() => {
    resetCanonicalInvalidationForTests();
    jest.useRealTimers();
  });

  it('maps treatments away from diary and milestone-detail', () => {
    expect(targetsForHint('treatments')).toEqual([
      'treatment-shell',
      'today',
      'treatment',
    ]);
    expect(targetsForHint('treatments')).not.toContain('diary');
    expect(targetsForHint('treatments')).not.toContain('milestone-detail');
  });

  it('maps doctor milestone photos to treatment and milestone-detail only', () => {
    expect(targetsForHint('doctor_milestone_photos')).toEqual([
      'treatment',
      'milestone-detail',
    ]);
  });

  it('coalesces assignment hints per target and does not notify the shell', async () => {
    jest.useFakeTimers();
    const shell = jest.fn();
    const today = jest.fn();
    const treatment = jest.fn();
    const diary = jest.fn();

    subscribeCanonicalInvalidation('treatment-shell', shell);
    subscribeCanonicalInvalidation('today', today);
    subscribeCanonicalInvalidation('treatment', treatment);
    subscribeCanonicalInvalidation('diary', diary);

    for (let index = 0; index < 5; index += 1) {
      invalidateFromHint('action_assignments');
    }

    await jest.advanceTimersByTimeAsync(200);

    expect(today).toHaveBeenCalledTimes(1);
    expect(treatment).toHaveBeenCalledTimes(1);
    expect(shell).not.toHaveBeenCalled();
    expect(diary).not.toHaveBeenCalled();
  });

  it('lets a treatments hint refetch a completed treatment shell', async () => {
    jest.useFakeTimers();
    const loadShell = jest.fn(async () => ({
      status: 'completed' as const,
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    }));
    subscribeCanonicalInvalidation('treatment-shell', loadShell);

    invalidateFromHint('treatments');
    await jest.advanceTimersByTimeAsync(200);

    await expect(loadShell.mock.results[0]?.value).resolves.toEqual({
      status: 'completed',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    });
  });

  it('notifies the treatment-shell listener from a treatments hint', async () => {
    jest.useFakeTimers();
    const shell = jest.fn();
    subscribeCanonicalInvalidation('treatment-shell', shell);

    invalidateFromHint('treatments');
    await jest.advanceTimersByTimeAsync(200);

    expect(shell).toHaveBeenCalledTimes(1);
  });
});
