module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed"
    });
  }

  try {
    const payload = req.body || {};

    if (!process.env.APPOINTMENTS_SCRIPT_URL) {
      return res.status(500).json({
        status: "error",
        message: "APPOINTMENTS_SCRIPT_URL is missing in Vercel"
      });
    }

    if (!process.env.APPS_SCRIPT_ADMIN_PASSWORD) {
      return res.status(500).json({
        status: "error",
        message: "APPS_SCRIPT_ADMIN_PASSWORD is missing in Vercel"
      });
    }

    const securePayload = {
      ...payload,
      password: process.env.APPS_SCRIPT_ADMIN_PASSWORD
    };

    const response = await fetch(process.env.APPOINTMENTS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(securePayload)
    });

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
