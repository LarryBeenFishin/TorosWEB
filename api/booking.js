// Public-facing proxy for the booking form.
// Hides the Google Apps Script URL from the client.
// No admin auth required — this is for customers.

module.exports = async function handler(req, res) {
  if (!process.env.APPOINTMENTS_SCRIPT_URL) {
    return res.status(500).json({
      status: "error",
      message: "APPOINTMENTS_SCRIPT_URL is missing"
    });
  }

  try {
    if (req.method === "GET") {
      // Availability check
      const date = req.query.date;
      if (!date) {
        return res.status(400).json({ status: "error", message: "Missing date" });
      }

      const url = `${process.env.APPOINTMENTS_SCRIPT_URL}?action=availability&date=${encodeURIComponent(date)}&v=${Date.now()}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      // Appointment submission or coupon signup
      const payload = req.body || {};

      const response = await fetch(process.env.APPOINTMENTS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      try {
        return res.status(200).json(JSON.parse(text));
      } catch (err) {
        return res.status(500).json({
          status: "error",
          message: "Invalid response from booking system"
        });
      }
    }

    return res.status(405).json({ status: "error", message: "Method not allowed" });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
