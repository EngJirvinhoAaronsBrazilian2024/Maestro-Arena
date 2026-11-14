import { Router } from "express";
import {
  getVapidConfig,
  upsertPushSubscription,
  updatePushPreferences,
  removePushSubscription,
  getAllSubscriptions,
  sendPushToSubscription,
} from "../services/pushService.js";

const router = Router();

// GET /api/push/vapid-public-key
router.get("/vapid-public-key", (req, res) => {
  try {
    const { publicKey } = getVapidConfig();
    res.json({ publicKey, enabled: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to load VAPID public key" });
  }
});

// POST /api/push/subscribe
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, oldEndpoint, userId, followedMatches, favorites, matchAlertsEnabled } = req.body || {};
    const saved = await upsertPushSubscription({
      subscription,
      oldEndpoint,
      userId,
      followedMatches,
      favorites,
      matchAlertsEnabled,
    });
    res.json({ success: true, endpoint: saved.endpoint });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Invalid subscription request" });
  }
});

// POST /api/push/preferences
router.post("/preferences", async (req, res) => {
  try {
    const { endpoint, userId, followedMatches, favorites, matchAlertsEnabled } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: "endpoint is required" });
    }
    const updated = await updatePushPreferences({
      endpoint,
      userId,
      followedMatches,
      favorites,
      matchAlertsEnabled,
    });
    if (!updated) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to update push preferences" });
  }
});

// POST /api/push/unsubscribe
router.post("/unsubscribe", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: "endpoint is required" });
    }
    await removePushSubscription(endpoint);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to unsubscribe" });
  }
});

// POST /api/push/test
router.post("/test", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: "endpoint is required" });
    }
    const sub = getAllSubscriptions().find((s) => s.endpoint === endpoint);
    if (!sub) {
      return res.status(404).json({ error: "Device is not subscribed yet" });
    }
    const ok = await sendPushToSubscription(sub, {
      title: "Maestro Arena Background Alerts Active",
      body: "Push notifications are connected. You will receive alerts even when the app is closed!",
      url: "/livescore",
      tag: `maestro_test_${Date.now()}`,
    });
    if (!ok) {
      return res.status(500).json({ error: "Push delivery failed — check browser notification permissions" });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to send test push" });
  }
});

export default router;
