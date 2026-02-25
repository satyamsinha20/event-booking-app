const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { register, login, logout, getMe } = require("../controllers/userController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

module.exports = router;

