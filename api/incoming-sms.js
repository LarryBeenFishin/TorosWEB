module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
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
