import type { ActionCompletion } from '../domain';

import {
  parseCompletionOverlay,
  serializeCompletionOverlay,
  type CompletionOverlayStore,
} from './completion-overlay-store';

export type InMemoryCompletionOverlayStore = CompletionOverlayStore & {
  getRaw(treatmentId: string): string | undefined;
  seedRaw(treatmentId: string, raw: string): void;
};

export function createInMemoryCompletionOverlayStore(options?: {
  onSave?: (
    treatmentId: string,
    completions: readonly ActionCompletion[],
  ) => Promise<void> | void;
}): InMemoryCompletionOverlayStore {
  const items = new Map<string, string>();

  return {
    getRaw(treatmentId) {
      return items.get(treatmentId);
    },
    seedRaw(treatmentId, raw) {
      items.set(treatmentId, raw);
    },
    async load(treatmentId) {
      return parseCompletionOverlay(items.get(treatmentId) ?? null, treatmentId);
    },
    async save(treatmentId, completions) {
      await options?.onSave?.(treatmentId, completions);
      items.set(treatmentId, serializeCompletionOverlay(treatmentId, completions));
    },
  };
}
