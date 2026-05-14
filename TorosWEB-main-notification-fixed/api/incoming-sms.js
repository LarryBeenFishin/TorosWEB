// Twilio webhook for incoming SMS.
// Validates the request is actually from Twilio using the X-Twilio-Signature header.
// This route is now the ONLY place that broadcasts push notifications for new incoming texts.
const twilio = require("twilio");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function safePhoneLabel(phone) {
  return String(phone || "Customer").trim() || "Customer";
}

async function sendIncomingSmsPush({ from, message, sid }) {
  // If push variables are not configured, do not fail the Twilio webhook.
  if (!process.env.APPOINTMENTS_SCRIPT_URL || !process.env.APPS_SCRIPT_ADMIN_PASSWORD) return;
  if (!process.env.VAPID_SUBJECT || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const response = await fetch(
    `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getPushSubscriptions&password=${process.env.APPS_SCRIPT_ADMIN_PASSWORD}`
  );

  const data = await response.json();
  const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
  if (!subscriptions.length) return;

  const dedupeKey = sid || [from, message].join("|");

  const payload = JSON.stringify({
    title: "New text from " + safePhoneLabel(from),
    body: message || "New message",
    url: "/admin",
    tag: "incoming-sms-" + dedupeKey,
    dedupeKey
  });

  await Promise.allSettled(
    subscriptions.map(subscription => webpush.sendNotification(subscription, payload))
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Validate Twilio signature if auth token is configured
  if (process.env.TWILIO_AUTH_TOKEN) {
    const signature = req.headers["x-twilio-signature"] || "";
    const url = `https://${req.headers.host}${req.url}`;
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      req.body || {}
    );
    if (!isValid) {
      return res.status(403).send("Forbidden");
    }
  }

  try {
    const from = req.body.From || "";
    const message = req.body.Body || "";
    const sid = req.body.MessageSid || req.body.SmsSid || "";

    await fetch(process.env.SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        secret: process.env.SHEETS_SECRET_KEY,
        type: "incoming",
        name: "Customer",
        phone: from,
        message: message,
        sid: sid
      })
    });

    // Broadcast push from the server at the actual moment Twilio receives the text.
    // IMPORTANT: On Vercel/serverless, fire-and-forget work can be stopped as soon as the response is sent.
    // Await it so iPhone/PWA subscriptions receive the push even when no admin page is open.
    // Push errors are logged but do not make Twilio retry the SMS webhook.
    try {
      await sendIncomingSmsPush({ from, message, sid });
    } catch (pushErr) {
      console.error("Incoming SMS push failed:", pushErr.message);
    }

    res.status(200).send("OK");

  } catch (err) {
    res.status(500).send("Server Error");
  }
};
