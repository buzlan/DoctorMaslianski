/**
 * AsyncStorage adapter for TASK-010 assignment-completion overlay.
 *
 * Persists only:
 * - treatmentId
 * - assignmentId
 * - completedOn
 *
 * Do not treat this as a decision to store future diary answers, patient
 * photos, or other clinical payloads in AsyncStorage. Local-at-rest storage
 * requirements must be reviewed before real-patient rollout.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActionCompletion } from '../domain';

import {
  completionOverlayStorageKey,
  parseCompletionOverlay,
  serializeCompletionOverlay,
  type CompletionOverlayStore,
} from './completion-overlay-store';

export function createAsyncStorageCompletionOverlayStore(): CompletionOverlayStore {
  return {
    async load(treatmentId: string): Promise<readonly ActionCompletion[]> {
      try {
        const raw = await AsyncStorage.getItem(completionOverlayStorageKey(treatmentId));
        return parseCompletionOverlay(raw, treatmentId);
      } catch {
        return [];
      }
    },
    async save(treatmentId: string, completions: readonly ActionCompletion[]): Promise<void> {
      await AsyncStorage.setItem(
        completionOverlayStorageKey(treatmentId),
        serializeCompletionOverlay(treatmentId, completions),
      );
    },
  };
}
