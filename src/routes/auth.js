const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const { signToken, requireAuth, COOKIE_NAME } = require("../middleware/auth");
const { isValidName, isValidEmail, isValidPassword } = require("../utils/validators");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  // opt-in flag, not NODE_ENV-tied: Secure cookie over plain HTTP silently drops + locks out login
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 2 * 60 * 60 * 1000,
};

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    const errors = [];

    if (!isValidName(name)) errors.push("A valid name (2-60 letters) is required.");
    if (!isValidEmail(email)) errors.push("A valid email address is required.");
    if (!isValidPassword(password)) {
      errors.push("Password must be 8-128 characters with at least one letter and one digit.");
    }
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db("users").where({ email: normalizedEmail }).first();
    if (existing) {
      return res.status(409).json({ ok: false, errors: ["An account with this email already exists."] });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [id] = await db("users").insert({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      role: "user",
    });

    const user = await db("users").where({ id }).first();
    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);
    res.status(201).json({ ok: true, user: publicUser(user) });
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({ ok: false, errors: ["Email and password are required."] });
    }

    const user = await db("users").where({ email: email.trim().toLowerCase() }).first();
    const match = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!match) {
      return res.status(401).json({ ok: false, errors: ["Invalid email or password."] });
    }

    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);
    res.json({ ok: true, user: publicUser(user) });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db("users").where({ id: req.user.sub }).first();
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: publicUser(user) });
  })
);

module.exports = router;
