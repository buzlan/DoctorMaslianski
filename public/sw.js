/*
 * Web Push delivery only.
 * This worker does not intercept fetches and does not store responses.
 */
importScripts('/push-route.js?v=4');

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }
  var kind = payload && typeof payload.kind === 'string' ? payload.kind : '';
  var copy = copyForPush(kind);
  var route = routeForPush(kind, payload && payload.route);
  var tag = payload && typeof payload.eventId === 'string' ? payload.eventId : 'doctor-maslianski';
  var badge = payload && typeof payload.badge === 'number' ? payload.badge : 1;
  event.waitUntil(Promise.all([
    self.registration.showNotification(copy.title, {
      body: copy.body,
      tag: tag,
      data: { kind: kind, route: route },
    }),
    applyAppBadge(badge),
    notifyOpenClients(),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var data = event.notification.data || {};
  var route = routeForPush(data.kind, data.route);
  event.waitUntil(openNotificationRoute(route));
});

function applyAppBadge(count) {
  if (typeof navigator.setAppBadge !== 'function') {
    return Promise.resolve();
  }
  var value = count > 0 ? Math.min(Math.floor(count), 99) : 1;
  return navigator.setAppBadge(value).catch(function () {
    return undefined;
  });
}

async function notifyOpenClients() {
  var windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (var index = 0; index < windowClients.length; index += 1) {
    windowClients[index].postMessage({ type: 'notification-received' });
  }
}

async function openNotificationRoute(route) {
  var windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (var index = 0; index < windowClients.length; index += 1) {
    var client = windowClients[index];
    if ('focus' in client) {
      await client.focus();
      client.postMessage({ type: 'notification-navigate', route: route });
      if (typeof client.navigate === 'function') {
        try {
          await client.navigate(route);
        } catch (error) {
          // The focused window still receives the route message.
        }
      }
      return;
    }
  }
  await self.clients.openWindow(route);
}
