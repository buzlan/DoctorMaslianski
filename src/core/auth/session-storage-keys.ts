/**
 * Keys supabase-js `_removeSession` deletes through the auth storage adapter.
 * Shared by native SecureStore and web localStorage. No platform APIs.
 */
export function authSessionStorageKeysForBaseKey(baseKey: string): string[] {
  return [baseKey, `${baseKey}-code-verifier`, `${baseKey}-user`];
}
