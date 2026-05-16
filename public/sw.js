self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json()
      const title = data.title || 'My Love'
      const options = {
        body: data.body || 'Bạn có thông báo mới',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/icon.png',
        data: {
          url: data.actionUrl || '/'
        }
      }

      event.waitUntil(self.registration.showNotification(title, options))
    } catch (e) {
      console.error('Error parsing push data:', e)
      // Fallback
      event.waitUntil(
        self.registration.showNotification('My Love', {
          body: event.data.text(),
          icon: '/icon.png'
        })
      )
    }
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  
  const urlToOpen = event.notification.data.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        // If so, just focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
