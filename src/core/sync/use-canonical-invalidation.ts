import { useEffect } from 'react';

import {
  subscribeCanonicalInvalidation,
  type InvalidationTarget,
} from './canonical-invalidation';

export function useCanonicalInvalidation(
  target: InvalidationTarget,
  listener: () => unknown | Promise<unknown>,
): void {
  useEffect(() => subscribeCanonicalInvalidation(target, listener), [target, listener]);
}
