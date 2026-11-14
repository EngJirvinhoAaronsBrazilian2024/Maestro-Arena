import fs from "fs";
import path from "path";
import webpush from "web-push";
import { getMatches, NormalizedMatch } from "./footballDataService.js";
import { getInsforgeAdmin } from "../insforgeAdmin.js";

export interface FavoritePref {
  id: string;
  type: "team" | "competition" | "match" | string;
  name: string;
}

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  followedMatches: string[];
  favorites: FavoritePref[];
  matchAlertsEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

interface VapidKeysFile {
  publicKey: string;
  privateKey: string;
  subject: string;
}

const DATA_DIR = path.join(process.cwd(), "src", "server", "data");
const VAPID_FILE = path.join(DATA_DIR, "vapid-keys.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

let vapidKeysCache: VapidKeysFile | null = null;
let subscriptionsCache: StoredPushSubscription[] | null = null;
let insforgePushTableAvailable: boolean | null = null;
let monitorStarted = false;

interface ServerMatchSnapshot {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusLabel: string;
  minute?: string;
}

const previousMatchSnapshots = new Map<string, ServerMatchSnapshot>();
const sentEventKeys = new Set<string>();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getVapidConfig(): VapidKeysFile {
  if (vapidKeysCache) return vapidKeysCache;

  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  const envSubject = process.env.VAPID_SUBJECT?.trim() || "mailto:alerts@maestroarena.app";

  if (envPub && envPriv) {
    vapidKeysCache = { publicKey: envPub, privateKey: envPriv, subject: envSubject };
    webpush.setVapidDetails(vapidKeysCache.subject, vapidKeysCache.publicKey, vapidKeysCache.privateKey);
    return vapidKeysCache;
  }

  ensureDataDir();
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(VAPID_FILE, "utf8")) as VapidKeysFile;
      if (parsed?.publicKey && parsed?.privateKey) {
        vapidKeysCache = {
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
          subject: parsed.subject || envSubject,
        };
        webpush.setVapidDetails(vapidKeysCache.subject, vapidKeysCache.publicKey, vapidKeysCache.privateKey);
        return vapidKeysCache;
      }
    } catch (err) {
      console.warn("[PushService] Failed reading vapid-keys.json, regenerating:", err);
    }
  }

  const generated = webpush.generateVAPIDKeys();
  vapidKeysCache = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: envSubject,
  };
  try {
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeysCache, null, 2), "utf8");
  } catch (err) {
    console.warn("[PushService] Could not persist vapid-keys.json:", err);
  }
  webpush.setVapidDetails(vapidKeysCache.subject, vapidKeysCache.publicKey, vapidKeysCache.privateKey);
  return vapidKeysCache;
}

function loadSubscriptionsFromDisk(): StoredPushSubscription[] {
  if (subscriptionsCache) return subscriptionsCache;
  ensureDataDir();
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    subscriptionsCache = [];
    return subscriptionsCache;
  }
  try {
    const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    subscriptionsCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    subscriptionsCache = [];
  }
  return subscriptionsCache;
}

function saveSubscriptionsToDisk(list: StoredPushSubscription[]) {
  subscriptionsCache = list;
  ensureDataDir();
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.warn("[PushService] Failed saving push-subscriptions.json:", err);
  }
}

async function mirrorSubscriptionToInsforge(sub: StoredPushSubscription) {
  if (insforgePushTableAvailable === false) return;
  try {
    const admin = getInsforgeAdmin();
    const { error } = await admin.database
      .from("push_subscriptions")
      .upsert(
        [
          {
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
            user_id: sub.userId || null,
            followed_matches: sub.followedMatches,
            favorites: sub.favorites,
            match_alerts_enabled: sub.matchAlertsEnabled,
            updated_at: new Date(sub.updatedAt).toISOString(),
          },
        ],
        { onConflict: "endpoint" }
      );
    if (error) {
      if (String(error.message || "").toLowerCase().includes("does not exist")) {
        insforgePushTableAvailable = false;
      }
      return;
    }
    insforgePushTableAvailable = true;
  } catch {
    // Non-fatal; disk store remains authoritative when table isn't provisioned
  }
}

async function removeSubscriptionFromInsforge(endpoint: string) {
  if (insforgePushTableAvailable === false) return;
  try {
    const admin = getInsforgeAdmin();
    await admin.database.from("push_subscriptions").delete().eq("endpoint", endpoint);
  } catch {
    // ignore
  }
}

export function getAllSubscriptions(): StoredPushSubscription[] {
  return loadSubscriptionsFromDisk();
}

export async function upsertPushSubscription(input: {
  subscription: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  oldEndpoint?: string;
  userId?: string;
  followedMatches?: string[];
  favorites?: FavoritePref[];
  matchAlertsEnabled?: boolean;
}): Promise<StoredPushSubscription> {
  const endpoint = input.subscription?.endpoint?.trim();
  const p256dh = input.subscription?.keys?.p256dh?.trim();
  const auth = input.subscription?.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription payload");
  }

  const list = [...loadSubscriptionsFromDisk()].filter(
    (s) => !input.oldEndpoint || s.endpoint !== input.oldEndpoint
  );
  const existingIdx = list.findIndex((s) => s.endpoint === endpoint);
  const now = Date.now();

  const existing = existingIdx >= 0 ? list[existingIdx] : undefined;
  const next: StoredPushSubscription = {
    endpoint,
    keys: { p256dh, auth },
    userId: input.userId !== undefined ? input.userId : existing?.userId,
    followedMatches: Array.isArray(input.followedMatches)
      ? input.followedMatches.map((id) => String(id).replace(/^match_/, ""))
      : existing?.followedMatches || [],
    favorites: Array.isArray(input.favorites) ? input.favorites : existing?.favorites || [],
    matchAlertsEnabled:
      typeof input.matchAlertsEnabled === "boolean"
        ? input.matchAlertsEnabled
        : existing?.matchAlertsEnabled ?? true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = next;
  } else {
    list.push(next);
  }

  saveSubscriptionsToDisk(list);
  void mirrorSubscriptionToInsforge(next);
  return next;
}

export async function updatePushPreferences(input: {
  endpoint: string;
  userId?: string;
  followedMatches?: string[];
  favorites?: FavoritePref[];
  matchAlertsEnabled?: boolean;
}): Promise<StoredPushSubscription | null> {
  const list = [...loadSubscriptionsFromDisk()];
  const idx = list.findIndex((s) => s.endpoint === input.endpoint);
  if (idx < 0) return null;

  const current = list[idx];
  const updated: StoredPushSubscription = {
    ...current,
    userId: input.userId !== undefined ? input.userId : current.userId,
    followedMatches: Array.isArray(input.followedMatches)
      ? input.followedMatches.map((id) => String(id).replace(/^match_/, ""))
      : current.followedMatches,
    favorites: Array.isArray(input.favorites) ? input.favorites : current.favorites,
    matchAlertsEnabled:
      typeof input.matchAlertsEnabled === "boolean"
        ? input.matchAlertsEnabled
        : current.matchAlertsEnabled,
    updatedAt: Date.now(),
  };

  list[idx] = updated;
  saveSubscriptionsToDisk(list);
  void mirrorSubscriptionToInsforge(updated);
  return updated;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const list = loadSubscriptionsFromDisk().filter((s) => s.endpoint !== endpoint);
  saveSubscriptionsToDisk(list);
  void removeSubscriptionFromInsforge(endpoint);
}

export async function sendPushToSubscription(
  sub: StoredPushSubscription,
  payload: PushPayload
): Promise<boolean> {
  getVapidConfig();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        tag: payload.tag || `maestro_${Date.now()}`,
        icon: payload.icon || "/pwa-192x192.png",
        badge: payload.badge || "/pwa-192x192.png",
      }),
      {
        TTL: 60 * 60, // 1 hour
      }
    );
    return true;
  } catch (err: any) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      await removePushSubscription(sub.endpoint);
    } else {
      console.warn("[PushService] Failed sending push:", status || err?.message);
    }
    return false;
  }
}

export async function broadcastPushNotification(
  payload: PushPayload,
  filterFn?: (sub: StoredPushSubscription) => boolean
): Promise<{ sent: number; total: number }> {
  const subs = loadSubscriptionsFromDisk();
  const targets = filterFn ? subs.filter(filterFn) : subs;
  if (targets.length === 0) return { sent: 0, total: 0 };

  const results = await Promise.allSettled(
    targets.map((sub) => sendPushToSubscription(sub, payload))
  );
  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  return { sent, total: targets.length };
}

function subscriberFollowsMatch(sub: StoredPushSubscription, match: NormalizedMatch): boolean {
  if (sub.matchAlertsEnabled === false) return false;
  const idStr = String(match.id);
  if (sub.followedMatches.includes(idStr)) return true;

  const homeLower = (match.homeTeam.name || "").toLowerCase();
  const awayLower = (match.awayTeam.name || "").toLowerCase();
  const compLower = (match.competition.name || "").toLowerCase();

  return sub.favorites.some((f) => {
    if (f.id === `match_${idStr}`) return true;
    if (f.type === "team") {
      if (f.id === `team_${match.homeTeam.id}` || f.id === `team_${match.awayTeam.id}`) return true;
      const favName = (f.name || "").toLowerCase();
      return favName.length > 2 && (homeLower.includes(favName) || awayLower.includes(favName));
    }
    if (f.type === "competition") {
      if (f.id === `competition_${match.competition.id}`) return true;
      const favComp = (f.name || "").toLowerCase();
      return favComp.length > 2 && compLower.includes(favComp);
    }
    return false;
  });
}

function markEventOnce(key: string): boolean {
  if (sentEventKeys.has(key)) return false;
  sentEventKeys.add(key);
  if (sentEventKeys.size > 2000) {
    const first = sentEventKeys.values().next().value;
    if (first) sentEventKeys.delete(first);
  }
  return true;
}

async function checkMatchesAndSendPush() {
  const subs = loadSubscriptionsFromDisk();
  if (subs.length === 0) return;

  const activeSubs = subs.filter(
    (s) => s.matchAlertsEnabled !== false && (s.followedMatches.length > 0 || s.favorites.length > 0)
  );
  if (activeSubs.length === 0) return;

  try {
    const { matches } = await getMatches();
    if (!matches || matches.length === 0) return;

    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    for (const match of matches) {
      const idStr = String(match.id);
      const prev = previousMatchSnapshots.get(idStr);
      const homeName = match.homeTeam.shortName || match.homeTeam.name;
      const awayName = match.awayTeam.shortName || match.awayTeam.name;
      const interestedSubs = activeSubs.filter((s) => subscriberFollowsMatch(s, match));

      if (interestedSubs.length > 0) {
        const kickoffMs = new Date(match.utcDate).getTime();
        const timeUntilStart = kickoffMs - now;

        // 1. 15-min Kick-Off Reminder
        if (
          match.status === "UPCOMING" &&
          Number.isFinite(timeUntilStart) &&
          timeUntilStart > 0 &&
          timeUntilStart <= FIFTEEN_MINUTES
        ) {
          const eventKey = `kickoff15_${idStr}`;
          if (markEventOnce(eventKey)) {
            const minsLeft = Math.max(1, Math.round(timeUntilStart / 60000));
            await Promise.allSettled(
              interestedSubs.map((sub) =>
                sendPushToSubscription(sub, {
                  title: `⏱️ Kick-Off in ${minsLeft}m`,
                  body: `${homeName} vs ${awayName} (${match.competition.name}) kicks off soon!`,
                  url: "/livescore",
                  tag: eventKey,
                })
              )
            );
          }
        }

        // 2. Live Goal Alerts
        if (prev && match.isLive) {
          const curHome = match.score.home ?? 0;
          const curAway = match.score.away ?? 0;
          const prevHome = prev.homeScore ?? 0;
          const prevAway = prev.awayScore ?? 0;

          if (match.score.home !== null && curHome > prevHome) {
            const eventKey = `goal_norm_${idStr}_${curHome}_${curAway}_h`;
            if (markEventOnce(eventKey)) {
              await Promise.allSettled(
                interestedSubs.map((sub) =>
                  sendPushToSubscription(sub, {
                    title: `⚽ GOAL! ${homeName}`,
                    body: `${homeName} ${curHome} - ${curAway} ${awayName} (${match.minute || "LIVE"})`,
                    url: "/livescore",
                    tag: eventKey,
                  })
                )
              );
            }
          }

          if (match.score.away !== null && curAway > prevAway) {
            const eventKey = `goal_norm_${idStr}_${curHome}_${curAway}_a`;
            if (markEventOnce(eventKey)) {
              await Promise.allSettled(
                interestedSubs.map((sub) =>
                  sendPushToSubscription(sub, {
                    title: `⚽ GOAL! ${awayName}`,
                    body: `${homeName} ${curHome} - ${curAway} ${awayName} (${match.minute || "LIVE"})`,
                    url: "/livescore",
                    tag: eventKey,
                  })
                )
              );
            }
          }
        }

        // 3. Half-Time Result Alert
        const isHalfTimeNow =
          match.statusLabel?.toUpperCase() === "HT" ||
          match.minute?.toUpperCase() === "HT" ||
          match.rawStatus?.toUpperCase() === "PAUSED";
        const wasHalfTimeBefore =
          prev &&
          (prev.statusLabel?.toUpperCase() === "HT" ||
            prev.minute?.toUpperCase() === "HT" ||
            prev.status === "PAUSED");

        if (prev && isHalfTimeNow && !wasHalfTimeBefore) {
          const eventKey = `ht_${idStr}`;
          if (markEventOnce(eventKey)) {
            await Promise.allSettled(
              interestedSubs.map((sub) =>
                sendPushToSubscription(sub, {
                  title: "⏸️ Half-Time",
                  body: `${homeName} ${match.score.home ?? 0} - ${match.score.away ?? 0} ${awayName} (${match.competition.name})`,
                  url: "/livescore",
                  tag: eventKey,
                })
              )
            );
          }
        }

        // 4. Full-Time Result Alert
        if (prev && prev.status !== "FINISHED" && match.status === "FINISHED") {
          const eventKey = `ft_${idStr}`;
          if (markEventOnce(eventKey)) {
            await Promise.allSettled(
              interestedSubs.map((sub) =>
                sendPushToSubscription(sub, {
                  title: "🏁 Full-Time Result",
                  body: `Final: ${homeName} ${match.score.home ?? 0} - ${match.score.away ?? 0} ${awayName}`,
                  url: "/livescore",
                  tag: eventKey,
                })
              )
            );
          }
        }
      }

      previousMatchSnapshots.set(idStr, {
        homeScore: match.score.home,
        awayScore: match.score.away,
        status: match.status,
        statusLabel: match.statusLabel,
        minute: match.minute,
      });
    }
  } catch (err) {
    console.warn("[PushService] Background match monitor check notice:", err);
  }
}

export function startPushBackgroundMonitor() {
  if (monitorStarted) return;
  monitorStarted = true;
  getVapidConfig();

  // Prime snapshot 10 seconds after boot, then check every 60 seconds
  setTimeout(() => {
    void checkMatchesAndSendPush();
  }, 10 * 1000);

  setInterval(() => {
    void checkMatchesAndSendPush();
  }, 60 * 1000);
}
