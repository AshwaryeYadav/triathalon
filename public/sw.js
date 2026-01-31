// TriCoach Service Worker for Push Notifications

const CACHE_NAME = 'tricoach-v1'

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  let data = {
    title: 'TriCoach 🏊‍♂️🚴🏃',
    body: 'Time for your workout!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'tricoach-notification',
    data: { url: '/' },
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        ...data,
        ...payload,
      }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'tricoach-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || { url: '/' },
    actions: data.actions || [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data

  if (action === 'dismiss') {
    return
  }

  // Open the app or focus existing window
  const urlToOpen = notificationData?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
})

// Background sync for offline workout completion
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts())
  }
})

// Sync offline workout data
async function syncWorkouts() {
  try {
    // Get pending workout completions from IndexedDB
    const pendingWorkouts = await getPendingWorkouts()
    
    for (const workout of pendingWorkouts) {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      })
    }
    
    // Clear pending workouts
    await clearPendingWorkouts()
  } catch (error) {
    console.error('Failed to sync workouts:', error)
  }
}

// IndexedDB helpers for offline support
function getPendingWorkouts() {
  return new Promise((resolve) => {
    const request = indexedDB.open('tricoach', 1)
    request.onsuccess = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingWorkouts')) {
        resolve([])
        return
      }
      const transaction = db.transaction(['pendingWorkouts'], 'readonly')
      const store = transaction.objectStore('pendingWorkouts')
      const getAllRequest = store.getAll()
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || [])
      getAllRequest.onerror = () => resolve([])
    }
    request.onerror = () => resolve([])
  })
}

function clearPendingWorkouts() {
  return new Promise((resolve) => {
    const request = indexedDB.open('tricoach', 1)
    request.onsuccess = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingWorkouts')) {
        resolve()
        return
      }
      const transaction = db.transaction(['pendingWorkouts'], 'readwrite')
      const store = transaction.objectStore('pendingWorkouts')
      store.clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    }
    request.onerror = () => resolve()
  })
}

// Periodic background sync for Whoop data (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-whoop') {
    event.waitUntil(syncWhoopData())
  }
})

async function syncWhoopData() {
  try {
    const response = await fetch('/api/whoop')
    const data = await response.json()
    
    // Check if recovery is low and send notification
    if (data.data?.recovery?.score < 50) {
      self.registration.showNotification('⚠️ Low Recovery Alert', {
        body: `Your recovery is ${data.data.recovery.score}%. Consider reducing today's workout intensity.`,
        icon: '/favicon.ico',
        tag: 'recovery-alert',
        data: { url: '/whoop' },
      })
    }
  } catch (error) {
    console.error('Failed to sync Whoop data:', error)
  }
}
