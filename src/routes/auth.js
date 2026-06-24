const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const {
  signToken,
  requireAuth,
  COOKIE_NAME,
} = require("../middleware/auth");

const {
  isValidName,
  isValidEmail,
  isValidPassword,
} = require("../utils/validators");

const router = express.Router();

/* -------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------- */

const success = (res, data = {}, status = 200) =>
  res.status(status).json({
    success: true,
    ...data,
  });

const error = (res, errors, status = 400) =>
  res.status(status).json({
    success: false,
    errors: Array.isArray(errors) ? errors : [errors],
  });

const sanitizeUser = (user) => {
  if (!user) return null;

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 1000 * 60 * 60 * 2,
};

/* -------------------------------------------------- */
/* Rate Limiting */
/* -------------------------------------------------- */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errors: [
      "Too many authentication attempts. Please try again later.",
    ],
  },
});

/* -------------------------------------------------- */
/* Register */
/* -------------------------------------------------- */

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    const errors = [];

    if (!isValidName(name))
      errors.push("Valid name required.");

    if (!isValidEmail(email))
      errors.push("Valid email required.");

    if (!isValidPassword(password))
      errors.push(
        "Password must contain at least 8 characters, one letter and one number."
      );

    if (errors.length) {
      return error(res, errors);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db("users")
      .where({ email: normalizedEmail })
      .first();

    if (existingUser) {
      return error(
        res,
        "An account with this email already exists.",
        409
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [userId] = await db("users").insert({
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "user",
    });

    const user = await db("users")
      .where({ id: userId })
      .first();

    const token = signToken(user);

    res.cookie(
      COOKIE_NAME,
      token,
      authCookieOptions
    );

    return success(
      res,
      {
        user: sanitizeUser(user),
      },
      201
    );
  })
);

/* -------------------------------------------------- */
/* Login */
/* -------------------------------------------------- */

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (
      !isValidEmail(email) ||
      typeof password !== "string" ||
      !password
    ) {
      return error(
        res,
        "Email and password are required."
      );
    }

    const user = await db("users")
      .where({
        email: email.trim().toLowerCase(),
      })
      .first();

    const passwordMatch = user
      ? await bcrypt.compare(
          password,
          user.password_hash
        )
      : false;

    if (!passwordMatch) {
      return error(
        res,
        "Invalid email or password.",
        401
      );
    }

    const token = signToken(user);

    res.cookie(
      COOKIE_NAME,
      token,
      authCookieOptions
    );

    return success(res, {
      user: sanitizeUser(user),
    });
  })
);

/* -------------------------------------------------- */
/* Logout */
/* -------------------------------------------------- */

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
  });

  return success(res, {
    message: "Logged out successfully.",
  });
});

/* -------------------------------------------------- */
/* Current User */
/* -------------------------------------------------- */

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db("users")
      .where({
        id: req.user.sub,
      })
      .first();

    if (!user) {
      return error(
        res,
        "User not found.",
        404
      );
    }

    return success(res, {
      user: sanitizeUser(user),
    });
  })
);

module.exports = router;
