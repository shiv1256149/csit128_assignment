const express = require("express");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const { isValidName, isValidEmail, isValidRating } = require("../utils/validators");

const router = express.Router();

router.get(
  "/company",
  asyncHandler(async (_req, res) => {
    const profile = await db("company_profile").first();
    if (!profile) return res.status(404).json({ error: "Company profile not set up." });

    const history = await db("company_history").orderBy("order_index").pluck("paragraph");
    const stats = await db("company_stats").orderBy("order_index").select("label", "value");
    const offices = await db("offices")
      .orderBy("order_index")
      .select("slug as id", "city", "country", "role", "opened", "address", "blurb");

    res.json({
      company: {
        name: profile.name,
        legalName: profile.legal_name,
        tagline: profile.tagline,
        founded: profile.founded,
        headquarters: profile.headquarters,
        email: profile.email,
        phone: profile.phone,
        mission: profile.mission,
        history,
        stats,
      },
      offices,
    });
  })
);

router.get(
  "/timeline",
  asyncHandler(async (_req, res) => {
    const rows = await db("timeline").orderBy("order_index").select("year", "milestone", "detail");
    res.json(rows);
  })
);

router.get(
  "/services",
  asyncHandler(async (_req, res) => {
    const rows = await db("services")
      .where({ is_active: true })
      .orderBy("order_index")
      .select("slug as id", "name", "icon", "summary", "details", "starting_price as startingPrice");
    res.json(rows);
  })
);

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const rows = await db("products")
      .where({ is_active: true })
      .orderBy("order_index")
      .select("slug as id", "name", "category", "description", "price", "image_url as imageUrl");
    res.json(rows);
  })
);

router.get(
  "/awards",
  asyncHandler(async (_req, res) => {
    const rows = await db("awards").orderBy("order_index").select("year", "title", "organisation", "note");
    res.json(rows);
  })
);

router.get(
  "/testimonials",
  asyncHandler(async (_req, res) => {
    const rows = await db("testimonials")
      .where({ is_active: true })
      .orderBy("order_index")
      .select("name", "role", "company", "rating", "quote");
    res.json(rows);
  })
);

router.get(
  "/team",
  asyncHandler(async (_req, res) => {
    const rows = await db("team_members")
      .where({ is_active: true })
      .orderBy("order_index")
      .select("name", "role", "initials", "founder", "accent", "bio");
    res.json(rows);
  })
);

router.get(
  "/comments",
  asyncHandler(async (_req, res) => {
    const rows = await db("comments")
      .where({ is_approved: true })
      .orderBy("submitted_at", "desc")
      .select("id", "name", "rating", "message", "submitted_at as submittedAt");
    res.json(rows);
  })
);

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, errors: ["Too many comments submitted. Please try again later."] },
});

// never trust client: re-check every field server-side too
router.post(
  "/comments",
  commentLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, rating, message } = req.body || {};
    const errors = [];

    if (!isValidName(name)) errors.push("A valid name (2-60 letters) is required.");
    if (!isValidEmail(email)) errors.push("A valid email address is required.");
    if (!isValidRating(rating)) errors.push("Rating must be a whole number between 1 and 5.");
    if (!message || message.trim().length < 10 || message.trim().length > 500) {
      errors.push("Message must be between 10 and 500 characters.");
    }
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const record = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: Number(rating),
      message: message.trim(),
    };

    const [id] = await db("comments").insert(record);
    res.status(201).json({
      ok: true,
      comment: { id, name: record.name, rating: record.rating, message: record.message },
    });
  })
);

module.exports = router;
