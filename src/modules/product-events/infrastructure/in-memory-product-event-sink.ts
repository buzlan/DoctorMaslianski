import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';
import { assertValidProductEvent } from '../domain';
import type { ProductEvent } from '../domain';

import type { ProductEventSink } from './product-event-sink';

export type InMemoryProductEventSink = ProductEventSink & {
  getAll(): readonly ProductEvent[];
};

class InMemoryProductEventLog implements InMemoryProductEventSink {
  private readonly events: ProductEvent[] = [];

  async append(event: ProductEvent): Promise<void> {
    this.events.push(assertValidProductEvent(event));
  }

  getAll(): readonly ProductEvent[] {
    return [...this.events];
  }
}

export function createInMemoryProductEventSink(): InMemoryProductEventSink {
  return new InMemoryProductEventLog();
}

const localProductEventSink = createInMemoryProductEventSink();

export const sharedProductEventSink: InMemoryProductEventSink = {
  async append(event) {
    if (shouldUseRemoteRepositories()) {
      const remote = getRemoteAdapters();
      if (remote !== null) {
        await remote.productEvents.append(event);
        return;
      }
    }

    await localProductEventSink.append(event);
  },
  getAll() {
    return localProductEventSink.getAll();
  },
};
