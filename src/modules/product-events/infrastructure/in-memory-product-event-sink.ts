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

export const sharedProductEventSink = createInMemoryProductEventSink();
