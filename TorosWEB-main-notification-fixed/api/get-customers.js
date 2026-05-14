const { requireAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const response = await fetch(
      `${process.env.APPOINTMENTS_SCRIPT_URL}?action=getCustomers&password=${process.env.APPS_SCRIPT_ADMIN_PASSWORD}`
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
      customers: []
    });
  }
};
