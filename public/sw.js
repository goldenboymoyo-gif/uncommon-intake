// Shows website notifications, even when the page is closed.
self.addEventListener('push', (event) => {
  let message = { title: 'Uncommon Intake', body: '', url: '/notifications' };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // keep the default message
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: message.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/'));
});
