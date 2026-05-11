const fs = require("fs");
const path = require("path");

module.exports = async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "messages.json");

    if (!fs.existsSync(filePath)) {
      return res.status(200).json([]);
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const messages = JSON.parse(raw || "[]");

    return res.status(200).json(messages);

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
