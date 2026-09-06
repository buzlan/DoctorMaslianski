import { AppState } from 'react-native';

const flushers = new Set<() => Promise<void>>();
let started = false;

export function registerRemoteOutboxFlusher(flush: () => Promise<void>): () => void {
  flushers.add(flush);
  ensureRemoteOutboxFlushStarted();
  return () => {
    flushers.delete(flush);
  };
}

export async function flushRegisteredRemoteOutboxes(): Promise<void> {
  await Promise.all([...flushers].map((flush) => flush()));
}

export function ensureRemoteOutboxFlushStarted(): void {
  if (started) {
    return;
  }

  started = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void flushRegisteredRemoteOutboxes();
    }
  });
}

export function resetRemoteOutboxFlushersForTests(): void {
  flushers.clear();
  started = false;
}
