var PUSH_COPY = {
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

var PUSH_ROUTES = {
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

var PUSH_ROUTE_ALLOW = {
  '/': true,
  '/diary': true,
  '/treatment': true,
  '/completed': true,
};

function routeForPush(kind, route) {
  if (typeof route === 'string' && PUSH_ROUTE_ALLOW[route] === true) {
    return route;
  }
  if (typeof kind === 'string' && Object.prototype.hasOwnProperty.call(PUSH_ROUTES, kind)) {
    return PUSH_ROUTES[kind];
  }
  return '/';
}

function copyForPush(kind) {
  var title = typeof kind === 'string' && Object.prototype.hasOwnProperty.call(PUSH_COPY, kind)
    ? PUSH_COPY[kind]
    : PUSH_COPY.treatment_updated;
  return { title: title, body: '' };
}
