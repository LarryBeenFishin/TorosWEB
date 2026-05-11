const fs = require("fs");
const path = require("path");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const from = req.body.From;
    const body = req.body.Body;

    const filePath = path.join(process.cwd(), "messages.json");

    let messages = [];

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      messages = JSON.parse(raw || "[]");
    }

    messages.unshift({
      type: "incoming",
      phone: from,
      message: body,
      date: new Date().toISOString()
    });

    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

    res.status(200).send("OK");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
