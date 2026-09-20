export function readSupabaseAuthStorageKey(client: object): string | null {
  const fromClient = readStorageKeyFromUnknown(client);
  if (fromClient !== null) {
    return fromClient;
  }

  if ('auth' in client) {
    return readStorageKeyFromUnknown((client as { auth?: unknown }).auth);
  }

  return null;
}

function readStorageKeyFromUnknown(value: unknown): string | null {
  if (value === null || typeof value !== 'object' || !('storageKey' in value)) {
    return null;
  }

  const key = (value as { storageKey?: unknown }).storageKey;
  return typeof key === 'string' && key.length > 0 ? key : null;
}
