const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const { User } = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { signSessionToken, setSessionCookie, clearSessionCookie } = require("../utils/session");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(200),
      password: z.string().min(6).max(200)
    });
    const { name, email, password } = schema.parse(req.body);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "user"
    });

    const token = signSessionToken(user._id);
    setSessionCookie(res, token);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email().max(200),
      password: z.string().min(1).max(200)
    });
    const { email, password } = schema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signSessionToken(user._id);
    setSessionCookie(res, token);

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

