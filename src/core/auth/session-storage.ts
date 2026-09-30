export {
  AUTH_SESSION_CHUNK_BYTE_SIZE,
  AUTH_SESSION_STORAGE_VERSION,
  authSessionStorageKeysForBaseKey,
  authStorageChunkKey,
  authStorageManifestKey,
  createAuthSessionStorage,
  createChunkedSecureStoreAuthStorage,
  parseAuthSessionManifest,
  removeAuthSessionStorageKeys,
  sanitizeAuthStorageKey,
  splitUtf8Chunks,
} from './session-storage.native';
export type { AuthSessionManifest, SecureStoreLike } from './session-storage.native';
