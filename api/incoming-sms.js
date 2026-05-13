// Twilio webhook for incoming SMS. 
// Validates the request is actually from Twilio using the X-Twilio-Signature header.
const twilio = require("twilio");

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
    const sid = req.body.MessageSid || "";

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

    res.status(200).send("OK");

  } catch (err) {
    res.status(500).send("Server Error");
  }
};
