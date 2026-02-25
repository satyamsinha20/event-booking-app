const jwt = require("jsonwebtoken");

function getCookieName() {
  return process.env.COOKIE_NAME || "eb_session";
}

function cookieOptions() {
  const secure = String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true";
  const sameSiteRaw = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(sameSiteRaw) ? sameSiteRaw : "lax";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  };
}

function signSessionToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function setSessionCookie(res, token) {
  res.cookie(getCookieName(), token, cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(getCookieName(), { path: "/" });
}

module.exports = { signSessionToken, setSessionCookie, clearSessionCookie };

