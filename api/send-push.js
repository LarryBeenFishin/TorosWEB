const webpush = require("web-push");

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

  try {
    const title = req.body?.title || "Toro's Auto Care";
    const body = req.body?.body || "New notification";
    const url = req.body?.url || "/admin";

    const response = await fetch(
      `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getPushSubscriptions&password=${process.env.APPS_SCRIPT_ADMIN_PASSWORD}`
    );

    const data = await response.json();
    const subscriptions = data.subscriptions || [];

    const payload = JSON.stringify({
      title,
      body,
      url
    });

    const results = await Promise.allSettled(
      subscriptions.map(subscription => webpush.sendNotification(subscription, payload))
    );

    const sent = results.filter(result => result.status === "fulfilled").length;
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
