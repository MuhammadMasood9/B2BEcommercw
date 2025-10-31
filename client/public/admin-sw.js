// Admin Panel Service Worker for Offline Functionality
const CACHE_NAME = 'b2b-admin-v1.0.0';
const OFFLINE_URL = '/admin/offline';

// Resources to cache for offline access
const STATIC_CACHE_URLS = [
  '/admin',
  '/admin/offline',
  '/admin/dashboard',
  '/admin/suppliers',
  '/admin/products',
  '/admin/orders',
  '/admin/monitoring',
  // Add critical CSS and JS files
  '/assets/admin-styles.css',
  '/assets/admin-bundle.js',
  // Add essential icons and images
  '/icons/admin-icon-192x192.png',
  '/icons/admin-icon-512x512.png'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/admin\/dashboard\/metrics$/,
  /^\/api\/admin\/suppliers\/overview$/,
  /^\/api\/admin\/orders\/summary$/,
  /^\/api\/admin\/monitoring\/health$/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[Admin SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Admin SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Admin SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Admin SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Admin SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests for our domain
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle admin panel routes
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(handleAdminRequest(request));
  }
  
  // Handle API requests
  else if (url.pathname.startsWith('/api/admin')) {
    event.respondWith(handleApiRequest(request));
  }
});

// Handle admin panel page requests
async function handleAdminRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for admin pages
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Admin SW] Network failed, trying cache:', url.pathname);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's an admin route and we have no cache, serve offline page
    if (url.pathname.startsWith('/admin')) {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Fallback to basic offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Admin Panel - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
              color: #334155;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 400px;
            }
            .icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              background: #e2e8f0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
            h1 {
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
              font-weight: 600;
            }
            p {
              margin: 0 0 1.5rem;
              color: #64748b;
            }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-weight: 500;
              cursor: pointer;
            }
            button:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>You're Offline</h1>
            <p>The admin panel is currently unavailable. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      }
    );
  }
}

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!shouldCache) {
    // For non-cacheable API requests, just try network
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Admin SW] API network failed, trying cache:', url.pathname);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add a header to indicate this is cached data
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From-Cache', 'true');
      return response;
    }
    
    // Return offline API response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline',
        cached: false
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Response': 'true'
        }
      }
    );
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Admin SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'admin-data-sync') {
    event.waitUntil(syncAdminData());
  }
});

// Sync admin data when back online
async function syncAdminData() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from pending list
        await removePendingAction(action.id);
      } catch (error) {
        console.error('[Admin SW] Failed to sync action:', action, error);
      }
    }
  } catch (error) {
    console.error('[Admin SW] Background sync failed:', error);
  }
}

// Helper functions for managing pending actions
async function getPendingActions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingAction(actionId) {
  // This would typically remove from IndexedDB
  console.log('[Admin SW] Removing pending action:', actionId);
}

// Handle push notifications for admin alerts
self.addEventListener('push', (event) => {
  console.log('[Admin SW] Push notification received');
  
  const options = {
    body: 'You have new admin notifications',
    icon: '/icons/admin-icon-192x192.png',
    badge: '/icons/admin-badge.png',
    tag: 'admin-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.tag = data.tag || options.tag;
  }
  
  event.waitUntil(
    self.registration.showNotification('B2B Admin Panel', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Admin SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/admin')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Admin SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});