// Shared auth helper for admin API routes.
// Checks for a session token that was issued at login.
// The token is a simple HMAC of the admin password + a timestamp,
// stored in the client and sent as a header with every request.

const crypto = require("crypto");

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken() {
  const timestamp = Date.now().toString();
  const secret = process.env.ADMIN_PASSWORD || "";
  const hmac = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
  return timestamp + "." + hmac;
}

function verifyToken(token) {
  if (!token || !process.env.ADMIN_PASSWORD) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, hmac] = parts;
  const secret = process.env.ADMIN_PASSWORD || "";
  const expected = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (hmac.length !== expected.length) return false;
  const hmacBuf = Buffer.from(hmac, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (hmacBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return false;

  // Check token age
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age < 0 || age > TOKEN_MAX_AGE_MS) return false;

  return true;
}

function requireAuth(req, res) {
  const token = req.headers["x-admin-token"] || "";
  if (!verifyToken(token)) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { generateToken, verifyToken, requireAuth };
