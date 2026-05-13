module.exports = async function handler(req, res) {
  try {
    const response = await fetch("https://torosautocare.com/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Test Push",
        body: "This is a test notification from Toro's Auto Care.",
        url: "/admin"
      })
    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
