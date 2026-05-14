// Public proxy for viewing inspection reports.
// No auth required — customers access these via a link.
// The inspection ID acts as the access token (unguessable UUID).

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ status: "error", message: "Missing inspection ID" });
    }

    if (!process.env.APPOINTMENTS_SCRIPT_URL) {
      return res.status(500).json({ status: "error", message: "Server configuration error" });
    }

    const url = `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getInspection&id=${encodeURIComponent(id)}`;
    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Could not load inspection"
    });
  }
};
