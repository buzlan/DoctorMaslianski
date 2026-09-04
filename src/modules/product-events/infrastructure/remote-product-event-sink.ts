import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import {
  classifyPostgrestWriteError,
  type RemoteWriteResult,
} from '@/core/sync/remote-error';
import {
  createWriteOutbox,
  nextOutboxItemId,
  type WriteOutboxStore,
} from '@/core/sync/write-outbox';
import type { AppSupabaseClient } from '@/core/supabase/client';
import { assertValidProductEvent, type ProductEvent } from '../domain';

import { mapProductEventInsert } from './map-product-event-insert';
import type { ProductEventSink } from './product-event-sink';

export type ProductEventOutboxPayload = {
  event: ProductEvent;
};

export type ProductEventRemoteGateway = {
  insertEvent(row: Record<string, unknown>): Promise<RemoteWriteResult>;
};

export function createSupabaseProductEventGateway(
  client: AppSupabaseClient,
): ProductEventRemoteGateway {
  return {
    async insertEvent(row) {
      const { error } = await client.from('product_events').insert(
        row as {
          name: string;
          occurred_at: string;
          pilot_cohort: 'internal_dry_run' | 'closed_beta' | 'clinic_pilot';
        },
      );
      return classifyPostgrestWriteError(error);
    },
  };
}

export type RemoteProductEventSinkOptions = {
  gateway: ProductEventRemoteGateway;
  resolveContext: () => Promise<RemotePatientContextResult>;
  outboxStore: WriteOutboxStore<ProductEventOutboxPayload>;
  readAuthUserId: () => string | null;
};

export type FlushableProductEventSink = ProductEventSink & {
  flush(): Promise<void>;
};

export function createRemoteProductEventSink(
  options: RemoteProductEventSinkOptions,
): FlushableProductEventSink {
  const outbox = createWriteOutbox({
    store: options.outboxStore,
    async flushItem(item) {
      const currentUserId = options.readAuthUserId();
      if (currentUserId !== item.authUserId) {
        return 'retry';
      }

      const context = await options.resolveContext();
      if (context.status !== 'ready' || context.context.authUserId !== item.authUserId) {
        return 'retry';
      }

      const mapped = mapProductEventInsert(item.payload.event, context.context);
      if (mapped.status === 'skip_no_cohort') {
        return 'retry';
      }

      if (mapped.status === 'skip_invalid') {
        return 'acked';
      }

      const result = await options.gateway.insertEvent(mapped.row);
      if (result === 'acked' || result === 'conflict' || result === 'integrity') {
        return 'acked';
      }

      return 'retry';
    },
  });

  return {
    async append(event: ProductEvent) {
      const valid = assertValidProductEvent(event);
      const authUserId = options.readAuthUserId();
      if (authUserId === null) {
        return;
      }

      const treatmentId = 'treatmentId' in valid ? valid.treatmentId : undefined;

      await outbox.enqueue({
        id: nextOutboxItemId(),
        authUserId,
        createdAt: valid.at,
        payload: { event: valid },
        ...(typeof treatmentId === 'string' ? { treatmentId } : {}),
      });

      try {
        await outbox.flush(authUserId);
      } catch {
        // Network failures stay queued. Today awaits append and must not error.
      }
    },
    async flush() {
      await outbox.flush(options.readAuthUserId());
    },
  };
}
