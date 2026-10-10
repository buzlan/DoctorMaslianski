const INBOX_TEXT: Record<string, string> = {
  daily_morning: 'У вас есть действие на сегодня.',
  daily_afternoon: 'У вас есть действие на сегодня.',
  appointment_previous_day: 'Уведомляем вас о ближайшей записи.',
  appointment_same_day: 'Уведомляем вас о ближайшей записи.',
  assignment_changed: 'В вашем плане появились изменения.',
  appointment_changed: 'В вашем плане появились изменения.',
  appointment_cancelled: 'Информация в приложении обновлена.',
  treatment_updated: 'Информация в приложении обновлена.',
  treatment_completed: 'Информация в приложении обновлена.',
  manual_test: 'Тестовое уведомление. Уведомления работают.',
};

export type InboxItem = {
  id: string;
  kind: string;
  route: string;
  createdAt: string;
  readAt: string | null;
};

export function textForNotification(kind: string): string {
  return INBOX_TEXT[kind] ?? INBOX_TEXT.treatment_updated;
}

export function unreadCount(items: readonly { readAt: string | null }[]): number {
  return items.reduce((count, item) => count + (item.readAt === null ? 1 : 0), 0);
}

export function unreadItems<T extends { id: string; readAt: string | null }>(
  items: readonly T[],
  viewedIds: readonly string[] = [],
): T[] {
  const viewed = new Set(viewedIds);
  return items.filter((item) => item.readAt === null && !viewed.has(item.id));
}

export function formatInboxTime(createdAt: string, timeZone = 'Europe/Minsk'): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ru', {
    timeZone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
