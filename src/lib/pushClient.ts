export interface PushSyncOptions {
  userId?: string;
  followedMatches?: string[];
  favorites?: Array<{ id: string; type: string; name: string }>;
  matchAlertsEnabled?: boolean;
}

const MATCH_TOASTS_KEY = 'sportshub_match_toasts_enabled';

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function readStoredMatchAlertsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(MATCH_TOASTS_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

export function readStoredFavorites(userId?: string): Array<{ id: string; type: string; name: string }> {
  try {
    const keysToTry: string[] = [];
    if (userId) keysToTry.push(`favorites_${userId}`);
    keysToTry.push('favorites_guest');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('favorites_') && !keysToTry.includes(k)) {
        keysToTry.push(k);
      }
    }

    for (const key of keysToTry) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((f) => f && f.id && f.name)
          .map((f) => ({ id: String(f.id), type: String(f.type || 'team'), name: String(f.name) }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function readStoredFollowedMatches(): string[] {
  try {
    const raw = localStorage.getItem('followedMatches');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return reg;
  } catch {
    return null;
  }
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  const reg = await getReadyRegistration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToWebPush(
  options: PushSyncOptions = {},
  requestPermission: boolean = true
): Promise<{ subscribed: boolean; permission: NotificationPermission | 'unsupported'; reason?: string }> {
  if (!isWebPushSupported()) {
    return { subscribed: false, permission: 'unsupported', reason: 'Web Push is not supported in this browser.' };
  }

  let permission = Notification.permission;
  if (permission === 'default' && requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return {
      subscribed: false,
      permission,
      reason:
        permission === 'denied'
          ? 'Notifications are blocked in your browser site settings.'
          : 'Notification permission was not granted.',
    };
  }

  const reg = await getReadyRegistration();
  if (!reg) {
    return { subscribed: false, permission, reason: 'Service worker is not ready yet. Please reload once and try again.' };
  }

  const keyRes = await fetch('/api/push/vapid-public-key');
  if (!keyRes.ok) {
    return { subscribed: false, permission, reason: 'Could not reach push server.' };
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    return { subscribed: false, permission, reason: 'Missing server VAPID public key.' };
  }

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });
  }

  const payload = {
    subscription: subscription.toJSON(),
    userId: options.userId,
    followedMatches: options.followedMatches ?? readStoredFollowedMatches(),
    favorites: options.favorites ?? readStoredFavorites(),
    matchAlertsEnabled: options.matchAlertsEnabled ?? readStoredMatchAlertsEnabled(),
  };

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { subscribed: false, permission, reason: 'Server failed to save push subscription.' };
  }

  return { subscribed: true, permission };
}

export async function syncPushPreferences(options: PushSyncOptions = {}): Promise<void> {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return;
  try {
    const subscription = await getActivePushSubscription();
    if (!subscription) {
      await subscribeToWebPush(options, false);
      return;
    }

    const body = {
      endpoint: subscription.endpoint,
      userId: options.userId,
      followedMatches: options.followedMatches ?? readStoredFollowedMatches(),
      favorites: options.favorites ?? readStoredFavorites(),
      matchAlertsEnabled: options.matchAlertsEnabled ?? readStoredMatchAlertsEnabled(),
    };

    const res = await fetch('/api/push/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 404) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          ...body,
        }),
      });
    }
  } catch {
    // Non-fatal background sync
  }
}

export async function unsubscribeFromWebPush(): Promise<boolean> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) return true;
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe();
    return true;
  } catch {
    return false;
  }
}

export async function sendTestWebPush(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) {
      return { ok: false, error: 'Background push is not active on this device yet.' };
    }
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error || 'Could not send test push notification.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error while testing push.' };
  }
}
