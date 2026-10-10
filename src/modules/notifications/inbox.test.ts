import { formatInboxTime, textForNotification, unreadCount, unreadItems } from './inbox';

describe('notification inbox', () => {
  it('uses the appointment notice and counts only unread items', () => {
    expect(textForNotification('appointment_same_day')).toBe('Уведомляем вас о ближайшей записи.');
    expect(textForNotification('appointment_previous_day')).toBe('Уведомляем вас о ближайшей записи.');
    expect(textForNotification('daily_morning')).toBe('У вас есть действие на сегодня.');
    expect(
      unreadCount([
        { readAt: null },
        { readAt: '2026-10-10T10:00:00.000Z' },
        { readAt: null },
      ]),
    ).toBe(2);
    expect(unreadCount([{ readAt: '2026-10-10T10:00:00.000Z' }])).toBe(0);
    expect(
      unreadItems(
        [
          { id: 'new', readAt: null },
          { id: 'seen', readAt: '2026-10-10T10:00:00.000Z' },
          { id: 'open', readAt: null },
        ],
        ['open'],
      ).map((item) => item.id),
    ).toEqual(['new']);
  });

  it('formats the inbox time in the clinic timezone', () => {
    expect(formatInboxTime('2026-10-10T16:30:00.000Z')).toBe('10 окт., 19:30');
  });
});
