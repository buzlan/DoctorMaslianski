import type { ProductEvent } from '../domain';

export type ProductEventSink = {
  append(event: ProductEvent): Promise<void>;
};
