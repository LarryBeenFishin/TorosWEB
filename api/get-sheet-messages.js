module.exports = async function handler(req, res) {

  try {

    const response = await fetch(
      `${process.env.SHEETS_WEB_APP_URL}?secret=${process.env.SHEETS_SECRET_KEY}`
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }

};
