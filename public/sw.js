// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: "open",
          title: "View",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "open" || !event.action) {
    const url = event.notification.data?.url || "/"
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }
})

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})
