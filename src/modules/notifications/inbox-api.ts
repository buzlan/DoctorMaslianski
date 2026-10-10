import { getSharedSupabaseClient, type AppSupabaseClient } from '@/core/supabase/client';

import type { InboxItem } from './inbox';

type InboxRow = {
  id: string;
  kind: string;
  route: string;
  created_at: string;
  read_at: string | null;
};

type InboxTable = {
  select(columns: string): {
    is(column: 'read_at', value: null): {
      order(column: 'created_at', options: { ascending: boolean }): {
        limit(count: number): Promise<{ data: InboxRow[] | null; error: { message: string } | null }>;
      };
    };
  };
  update(values: { read_at: string }): {
    in(column: 'id', values: string[]): Promise<{ error: { message: string } | null }>;
  };
};

function inboxTable(client: AppSupabaseClient): InboxTable {
  return (client as unknown as { from(name: 'notification_events'): InboxTable }).from('notification_events');
}

export async function loadNotificationInbox(
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<InboxItem[]> {
  if (client === null) {
    return [];
  }
  const result = await inboxTable(client)
    .select('id, kind, route, created_at, read_at')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(30);
  if (result.error || result.data === null) {
    return [];
  }
  return result.data.map((row) => ({
    id: row.id,
    kind: row.kind,
    route: row.route,
    createdAt: row.created_at,
    readAt: row.read_at,
  }));
}

export async function markNotificationsViewed(
  ids: readonly string[],
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<boolean> {
  if (client === null || ids.length === 0) {
    return true;
  }
  const result = await inboxTable(client)
    .update({ read_at: new Date().toISOString() })
    .in('id', [...ids]);
  return result.error === null;
}
