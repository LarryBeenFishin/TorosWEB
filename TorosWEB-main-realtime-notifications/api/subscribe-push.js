const { requireAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  if (!requireAuth(req, res)) return;

  try {
    const subscription = req.body?.subscription;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Missing push subscription"
      });
    }

    const response = await fetch(process.env.APPOINTMENTS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "savePushSubscription",
        password: process.env.APPS_SCRIPT_ADMIN_PASSWORD,
        subscription
      })
    });

    const text = await response.text();

    try {
      return res.status(200).json(JSON.parse(text));
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Apps Script did not return valid JSON",
        raw: text
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
