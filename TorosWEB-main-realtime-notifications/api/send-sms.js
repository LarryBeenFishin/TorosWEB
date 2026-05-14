const twilio = require("twilio");
const { requireAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  if (!requireAuth(req, res)) return;

  try {
    const { to, message, name } = req.body;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    await fetch(process.env.SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        secret: process.env.SHEETS_SECRET_KEY,
        type: "outgoing",
        name: name || "",
        phone: to,
        message: message,
        sid: result.sid
      })
    });

    return res.status(200).json({
      success: true,
      sid: result.sid
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
