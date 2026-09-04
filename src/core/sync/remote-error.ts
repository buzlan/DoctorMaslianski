export class RetryableRemoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableRemoteError';
  }
}

export function isRetryableRemoteError(error: unknown): boolean {
  return error instanceof RetryableRemoteError;
}

export type RemoteWriteResult = 'acked' | 'conflict' | 'retry' | 'integrity';

export function classifyPostgrestWriteError(error: {
  code?: string | null;
  message?: string;
} | null): RemoteWriteResult {
  if (error === null) {
    return 'acked';
  }

  if (error.code === '23505') {
    return 'conflict';
  }

  if (error.code === '23514' || error.code === '42501') {
    return 'integrity';
  }

  return 'retry';
}
