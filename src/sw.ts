import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

interface SWNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface SWNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
  actions?: SWNotificationAction[];
}

interface SWClient {
  url: string;
  focused?: boolean;
  focus(): Promise<SWClient>;
  navigate?(url: string): Promise<SWClient | null>;
}

interface SWPushSubscription {
  endpoint: string;
  toJSON(): Record<string, unknown>;
}

interface SWPushManager {
  subscribe(options: { userVisibleOnly: boolean; applicationServerKey?: Uint8Array | string }): Promise<SWPushSubscription>;
}

interface SWRegistration {
  pushManager: SWPushManager;
  showNotification(title: string, options?: SWNotificationOptions): Promise<void>;
}

interface SWPushEvent extends ExtendableEvent {
  data?: {
    json(): Record<string, unknown>;
    text(): string;
  } | null;
}

interface SWNotificationEvent extends ExtendableEvent {
  action: string;
  notification: Notification & { data?: { url?: string } };
}

interface SWPushSubscriptionChangeEvent extends ExtendableEvent {
  oldSubscription?: SWPushSubscription | null;
  newSubscription?: SWPushSubscription | null;
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface SWGlobalScope {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
  registration: SWRegistration;
  location: Location;
  clients: {
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<SWClient[]>;
    openWindow(url: string): Promise<SWClient | null>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install' | 'activate', listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'push', listener: (event: SWPushEvent) => void): void;
  addEventListener(type: 'notificationclick', listener: (event: SWNotificationEvent) => void): void;
  addEventListener(type: 'pushsubscriptionchange', listener: (event: SWPushSubscriptionChangeEvent) => void): void;
}

const sw = self as unknown as SWGlobalScope;

sw.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Precache static build assets injected by VitePWA injectManifest
// @ts-expect-error Injected at build time by vite-plugin-pwa injectManifest
precacheAndRoute(self.__WB_MANIFEST || []);

// SPA Navigation fallback excluding /api/*
const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//],
  })
);

// Runtime caching preserved from Workbox config
registerRoute(
  ({ url }) => /^\/api\/(matches|articles|sports\/transfers)/i.test(url.pathname),
  new NetworkFirst({
    cacheName: 'api-live-data-cache',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://media.api-sports.io',
  new CacheFirst({
    cacheName: 'api-sports-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://images.unsplash.com',
  new StaleWhileRevalidate({
    cacheName: 'unsplash-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 14 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => /\.(?:png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'app-media-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Handle incoming Web Push notifications even when the app is completely closed
sw.addEventListener('push', (event: SWPushEvent) => {
  let title = 'Maestro Arena';
  let body = 'You have a new football update.';
  let tag = `maestro_${Date.now()}`;
  let url = '/';
  let icon = '/pwa-192x192.png';
  let badge = '/pwa-192x192.png';

  if (event.data) {
    try {
      const payload = event.data.json();
      if (typeof payload.title === 'string' && payload.title.trim()) {
        title = payload.title.trim();
      }
      if (typeof payload.body === 'string' && payload.body.trim()) {
        body = payload.body.trim();
      }
      if (typeof payload.tag === 'string' && payload.tag.trim()) {
        tag = payload.tag.trim();
      }
      if (typeof payload.url === 'string' && payload.url.trim()) {
        url = payload.url.trim();
      }
      if (typeof payload.icon === 'string' && payload.icon.trim()) {
        icon = payload.icon.trim();
      }
      if (typeof payload.badge === 'string' && payload.badge.trim()) {
        badge = payload.badge.trim();
      }
    } catch {
      try {
        const text = event.data.text();
        if (text && text.trim()) {
          body = text.trim();
        }
      } catch {
        // ignore unparseable payload
      }
    }
  }

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      vibrate: [150, 80, 150],
      data: { url },
    })
  );
});

// Open or focus the relevant app page when user taps a push notification
sw.addEventListener('notificationclick', (event: SWNotificationEvent) => {
  event.notification.close();
  const targetPath = event.notification?.data?.url || '/';
  const targetUrl = new URL(targetPath, sw.location.origin).href;

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(sw.location.origin)) {
            await client.focus();
            if (typeof client.navigate === 'function') {
              await client.navigate(targetUrl).catch(() => null);
            }
            return;
          }
        }
        await sw.clients.openWindow(targetUrl);
      })
  );
});

// Re-sync subscription automatically if browser rotates push keys
sw.addEventListener('pushsubscriptionchange', (event: SWPushSubscriptionChangeEvent) => {
  event.waitUntil(
    (async () => {
      try {
        let subscription = event.newSubscription;
        if (!subscription) {
          const res = await fetch('/api/push/vapid-public-key');
          if (!res.ok) return;
          const { publicKey } = await res.json();
          if (!publicKey) return;
          subscription = await sw.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });
        }
        if (subscription) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              oldEndpoint: event.oldSubscription?.endpoint,
            }),
          });
        }
      } catch {
        // Silent failure; client will re-sync on next open
      }
    })()
  );
});
