module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { password } = req.body || {};

    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: "ADMIN_PASSWORD is not set in Vercel"
      });
    }

    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({
        success: true
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid password"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
