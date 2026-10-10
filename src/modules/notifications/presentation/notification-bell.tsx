import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { routeForNotification } from '@/modules/notifications/routes';
import { copy } from '@/shared/copy';
import { getColors, theme } from '@/shared/theme';
import { AppIcon } from '@/shared/ui/app-icon';
import { AppText } from '@/shared/ui/app-text';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Stack } from '@/shared/ui/stack';

import { syncAppBadge } from '../app-badge';
import { formatInboxTime, textForNotification, unreadCount, unreadItems, type InboxItem } from '../inbox';
import { loadNotificationInbox, markNotificationsViewed } from '../inbox-api';

export function NotificationBell() {
  const router = useRouter();
  const colors = getColors(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState(false);
  const unread = unreadCount(items);

  const refresh = useCallback(async () => {
    const next = unreadItems(await loadNotificationInbox());
    setItems(next);
    syncAppBadge(unreadCount(next));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || navigator.serviceWorker === undefined) {
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'notification-received') {
        void refresh();
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, [refresh]);

  async function markIds(ids: readonly string[]) {
    const unreadIds = items.filter((item) => ids.includes(item.id) && item.readAt === null).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }
    const next = unreadItems(items, unreadIds);
    setItems(next);
    syncAppBadge(unreadCount(next));
    await markNotificationsViewed(unreadIds);
  }

  async function onOpenItem(item: InboxItem) {
    await markIds([item.id]);
    setOpen(false);
    router.navigate(routeForNotification(item.kind, item.route));
  }

  const list = open && typeof document !== 'undefined'
    ? createPortal(
        <View style={styles.backdrop}>
          <Card style={styles.sheet}>
            <Stack gap="md">
              <AppText variant="title" accessibilityRole="header">
                {copy.notifications.inboxTitle}
              </AppText>
              {items.length === 0 ? <AppText tone="secondary">{copy.notifications.inboxEmpty}</AppText> : null}
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {items.map((item) => (
                  <Pressable key={item.id} onPress={() => void onOpenItem(item)}>
                    <View style={styles.row}>
                      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                      <Stack gap="xs" style={styles.rowCopy}>
                        <AppText>{textForNotification(item.kind)}</AppText>
                        <AppText variant="caption" tone="secondary">
                          {formatInboxTime(item.createdAt)}
                        </AppText>
                      </Stack>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              {unread > 0 ? (
                <Button
                  label={copy.notifications.markViewed}
                  variant="secondary"
                  onPress={() => {
                    void markIds(items.map((item) => item.id));
                  }}
                />
              ) : null}
              <Button label={copy.pwa.close} variant="secondary" onPress={() => setOpen(false)} />
            </Stack>
          </Card>
        </View>,
        document.body,
      )
    : null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.brand.notifications}
        onPress={() => {
          setOpen(true);
          void refresh();
        }}
        style={[styles.bell, { backgroundColor: colors.surface }]}
      >
        <AppIcon name="notifications-outline" size={24} color={colors.textSecondary} />
        {unread > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <AppText variant="caption" style={styles.badgeText}>
              {unread > 9 ? '9+' : String(unread)}
            </AppText>
          </View>
        ) : null}
      </Pressable>
      {list}
    </>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 14,
  },
  backdrop: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(27, 36, 48, 0.28)',
    zIndex: 60,
  } as ViewStyle,
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    maxHeight: '80%',
  },
  list: {
    maxHeight: 360,
    overflow: 'scroll',
  },
  listContent: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  rowCopy: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
