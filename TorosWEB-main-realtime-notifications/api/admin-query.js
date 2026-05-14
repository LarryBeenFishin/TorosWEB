const { requireAuth } = require("./_auth");

// Proxy for admin read operations that previously called Google Apps Script directly from the browser.
// This keeps the Script URL and password server-side only.

const ALLOWED_ACTIONS = [
  "getAppointments",
  "getInspections",
  "getInspection",
  "availability"
];

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const action = req.query.action || "";
    
    if (!ALLOWED_ACTIONS.includes(action)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid action"
      });
    }

    if (!process.env.APPOINTMENTS_SCRIPT_URL) {
      return res.status(500).json({
        status: "error",
        message: "APPOINTMENTS_SCRIPT_URL is missing in Vercel"
      });
    }

    // Build the query string for the Apps Script
    const params = new URLSearchParams();
    params.set("action", action);
    params.set("password", process.env.APPS_SCRIPT_ADMIN_PASSWORD || "");

    // Pass through safe query params (e.g. date for availability, id for getInspection)
    if (req.query.date) params.set("date", req.query.date);
    if (req.query.id) params.set("id", req.query.id);

    const url = `${process.env.APPOINTMENTS_SCRIPT_URL}?${params.toString()}&cacheBust=${Date.now()}`;
    const response = await fetch(url);
    const text = await response.text();

    try {
      return res.status(200).json(JSON.parse(text));
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: "Apps Script did not return valid JSON",
        raw: text
      });
    }

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
