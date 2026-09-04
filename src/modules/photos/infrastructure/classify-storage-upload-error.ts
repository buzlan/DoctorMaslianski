export type StorageUploadResult = 'acked' | 'duplicate' | 'retry' | 'integrity';

type StorageErrorFields = {
  statusCode?: string | number;
  status?: number;
  error?: string;
  message?: string;
  name?: string;
};

function asFields(error: unknown): StorageErrorFields | null {
  if (error === null || typeof error !== 'object') {
    return null;
  }

  return error as StorageErrorFields;
}

function isObjectAlreadyExists(error: StorageErrorFields): boolean {
  const name = (error.error ?? '').toLowerCase();
  const message = (error.message ?? '').trim().toLowerCase();

  if (name === 'duplicate') {
    return true;
  }

  return message === 'the resource already exists';
}

function numericStatus(error: StorageErrorFields): number {
  const raw = error.statusCode ?? error.status;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string' && raw.length > 0) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function classifyStorageUploadError(error: unknown): StorageUploadResult {
  if (error === null || error === undefined) {
    return 'acked';
  }

  const fields = asFields(error);
  if (fields === null) {
    return 'retry';
  }

  if (isObjectAlreadyExists(fields)) {
    return 'duplicate';
  }

  const status = numericStatus(fields);
  if (status === 401 || status === 403) {
    return 'retry';
  }

  if (status >= 500 || status === 408 || status === 429) {
    return 'retry';
  }

  if (status === 400 || status === 404 || status === 413 || status === 415) {
    return 'integrity';
  }

  return 'retry';
}
