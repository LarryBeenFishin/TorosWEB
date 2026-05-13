const { requireAuth } = require("./_auth");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const response = await fetch(
      `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getPushSubscriptions&password=${process.env.APPS_SCRIPT_ADMIN_PASSWORD}`
    );

    const data = await response.json();
    const subscriptions = data.subscriptions || [];

    const payload = JSON.stringify({
      title: "Test Push",
      body: "This is a test notification from Toro's Auto Care.",
      url: "/admin"
    });

    const results = await Promise.allSettled(
      subscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload)
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return res.status(200).json({
      success: true,
      sent,
      failed
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
