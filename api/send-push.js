const webpush = require("web-push");
const { requireAuth } = require("./_auth");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  if (!requireAuth(req, res)) return;

  try {
    // If ?test=true, use hardcoded test values
    const isTest = req.query.test === "true";
    const title = isTest ? "Test Push" : (req.body?.title || "Toro's Auto Care");
    const body = isTest ? "This is a test notification from Toro's Auto Care." : (req.body?.body || "New notification");
    const url = isTest ? "/admin" : (req.body?.url || "/admin");
    const tag = isTest ? "test-push" : (req.body?.tag || req.body?.dedupeKey || undefined);
    const dedupeKey = isTest ? "test-push" : (req.body?.dedupeKey || undefined);

    const response = await fetch(
      `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getPushSubscriptions&password=${process.env.APPS_SCRIPT_ADMIN_PASSWORD}`
    );

    const data = await response.json();
    const subscriptions = data.subscriptions || [];

    const payload = JSON.stringify({ title, body, url, tag, dedupeKey });

    const results = await Promise.allSettled(
      subscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload)
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return res.status(200).json({ success: true, sent, failed });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
