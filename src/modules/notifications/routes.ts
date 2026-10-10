const ALLOWED_ROUTES = new Set(['/', '/diary', '/treatment', '/completed']);

const KIND_ROUTES: Record<string, '/' | '/diary' | '/treatment' | '/completed'> = {
  daily_morning: '/',
  daily_afternoon: '/',
  appointment_previous_day: '/',
  appointment_same_day: '/',
  assignment_changed: '/',
  appointment_changed: '/',
  appointment_cancelled: '/',
  treatment_updated: '/treatment',
  treatment_completed: '/',
  manual_test: '/',
};

export function routeForNotification(
  kind: string,
  route: string | null | undefined,
): '/' | '/diary' | '/treatment' | '/completed' {
  if (
    route === '/' ||
    route === '/diary' ||
    route === '/treatment' ||
    route === '/completed'
  ) {
    return route;
  }
  return KIND_ROUTES[kind] ?? '/';
}

export function routeFromNotificationMessage(data: unknown): string | null {
  if (data === null || typeof data !== 'object') {
    return null;
  }
  const record = data as { type?: unknown; route?: unknown };
  if (record.type !== 'notification-navigate' || typeof record.route !== 'string') {
    return null;
  }
  if (!ALLOWED_ROUTES.has(record.route)) {
    return null;
  }
  return record.route;
}
