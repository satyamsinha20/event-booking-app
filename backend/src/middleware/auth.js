const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

function getCookieName() {
  return process.env.COOKIE_NAME || "eb_session";
}

function getTokenFromRequest(req) {
  const header = req.headers?.authorization;
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }
  const cookie = req.cookies?.[getCookieName()];
  if (cookie) return cookie;
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (_err) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

module.exports = { requireAuth, requireAdmin };

