import { createInvalidationController } from './create-invalidation-controller';

describe('createInvalidationController', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('coalesces a burst into one run', async () => {
    jest.useFakeTimers();
    const run = jest.fn(async () => undefined);
    const controller = createInvalidationController({ run, debounceMs: 200 });

    controller.invalidate();
    controller.invalidate();
    controller.invalidate();
    controller.invalidate();
    controller.invalidate();

    expect(run).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(200);
    expect(run).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('runs at most one follow-up when invalidated during an in-flight run', async () => {
    jest.useFakeTimers();
    let release!: () => void;
    const first = new Promise<void>((resolve) => {
      release = resolve;
    });
    const run = jest.fn(async () => {
      if (run.mock.calls.length === 1) {
        await first;
      }
    });
    const controller = createInvalidationController({ run, debounceMs: 200 });

    controller.invalidate();
    await jest.advanceTimersByTimeAsync(200);
    expect(run).toHaveBeenCalledTimes(1);

    controller.invalidate();
    controller.invalidate();
    await jest.advanceTimersByTimeAsync(200);
    release();
    await first;
    await Promise.resolve();
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('flushNow runs immediately and does not drop a later pending invalidation', async () => {
    const run = jest.fn(async () => undefined);
    const controller = createInvalidationController({ run, debounceMs: 200 });

    await controller.flushNow();
    expect(run).toHaveBeenCalledTimes(1);
    controller.dispose();
  });
});
