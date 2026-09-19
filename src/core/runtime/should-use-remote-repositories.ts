import {
  ensureAuthSessionStarted,
  getAuthSessionSnapshot,
} from '../auth/auth-session';
import { getSharedSupabaseClient } from '../supabase/client';

export function shouldUseRemoteRepositories(): boolean {
  ensureAuthSessionStarted();
  return (
    getSharedSupabaseClient() !== null &&
    getAuthSessionSnapshot().status === 'authenticated'
  );
}
