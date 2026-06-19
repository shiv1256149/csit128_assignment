const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const { requireAdminSession } = require("../middleware/adminAuth");
const { attachCsrfToken, verifyCsrfToken } = require("../middleware/csrf");
const { isValidName, isValidEmail } = require("../utils/validators");

const router = express.Router();

router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 4 * 60 * 60 * 1000,
    },
  })
);
router.use(attachCsrfToken);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/login", (req, res) => {
  if (req.session.admin) return res.redirect("/admin");
  res.render("admin/login", { error: null });
});

router.post("/login", loginLimiter, verifyCsrfToken, async (req, res) => {
  const { email, password } = req.body || {};
  const user = email
    ? await db("users").where({ email: String(email).trim().toLowerCase(), role: "admin" }).first()
    : null;
  const match = user ? await bcrypt.compare(password || "", user.password_hash) : false;

  if (!match) {
    return res.status(401).render("admin/login", { error: "Invalid credentials." });
  }

  req.session.admin = { id: user.id, name: user.name, email: user.email };
  res.redirect("/admin");
});

router.post("/logout", verifyCsrfToken, (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

router.use(requireAdminSession);

router.get("/", async (req, res) => {
  const [{ count: products }] = await db("products").count("id as count");
  const [{ count: services }] = await db("services").count("id as count");
  const [{ count: team }] = await db("team_members").count("id as count");
  const [{ count: comments }] = await db("comments").count("id as count");
  const [{ count: users }] = await db("users").count("id as count");

  res.render("admin/dashboard", {
    admin: req.session.admin,
    counts: { products, services, team, comments, users },
  });
});

/* ---------------------------------------------------------------- *
 * Products
 * ---------------------------------------------------------------- */
router.get("/products", async (req, res) => {
  const products = await db("products").orderBy("order_index");
  res.render("admin/products", { admin: req.session.admin, products, editing: null });
});

router.get("/products/:id/edit", async (req, res) => {
  const product = await db("products").where({ id: req.params.id }).first();
  if (!product) return res.redirect("/admin/products");
  const products = await db("products").orderBy("order_index");
  res.render("admin/products", { admin: req.session.admin, products, editing: product });
});

router.post("/products", verifyCsrfToken, async (req, res) => {
  const { slug, name, category, description, price, image_url, order_index } = req.body;
  if (!slug || !name) return res.redirect("/admin/products");
  await db("products").insert({
    slug: slug.trim(),
    name: name.trim(),
    category: category?.trim() || null,
    description: description?.trim() || null,
    price: price?.trim() || null,
    image_url: image_url?.trim() || null,
    order_index: Number(order_index) || 0,
  });
  res.redirect("/admin/products");
});

router.post("/products/:id", verifyCsrfToken, async (req, res) => {
  const { slug, name, category, description, price, image_url, order_index, is_active } = req.body;
  await db("products")
    .where({ id: req.params.id })
    .update({
      slug: slug?.trim(),
      name: name?.trim(),
      category: category?.trim() || null,
      description: description?.trim() || null,
      price: price?.trim() || null,
      image_url: image_url?.trim() || null,
      order_index: Number(order_index) || 0,
      is_active: is_active === "on",
      updated_at: db.fn.now(),
    });
  res.redirect("/admin/products");
});

router.post("/products/:id/delete", verifyCsrfToken, async (req, res) => {
  await db("products").where({ id: req.params.id }).del();
  res.redirect("/admin/products");
});

/* ---------------------------------------------------------------- *
 * Services
 * ---------------------------------------------------------------- */
router.get("/services", async (req, res) => {
  const services = await db("services").orderBy("order_index");
  res.render("admin/services", { admin: req.session.admin, services, editing: null });
});

router.get("/services/:id/edit", async (req, res) => {
  const service = await db("services").where({ id: req.params.id }).first();
  if (!service) return res.redirect("/admin/services");
  const services = await db("services").orderBy("order_index");
  res.render("admin/services", { admin: req.session.admin, services, editing: service });
});

router.post("/services", verifyCsrfToken, async (req, res) => {
  const { slug, name, icon, summary, details, starting_price, order_index } = req.body;
  if (!slug || !name) return res.redirect("/admin/services");
  await db("services").insert({
    slug: slug.trim(),
    name: name.trim(),
    icon: icon?.trim() || null,
    summary: summary?.trim() || null,
    details: details?.trim() || null,
    starting_price: starting_price?.trim() || null,
    order_index: Number(order_index) || 0,
  });
  res.redirect("/admin/services");
});

router.post("/services/:id", verifyCsrfToken, async (req, res) => {
  const { slug, name, icon, summary, details, starting_price, order_index, is_active } = req.body;
  await db("services")
    .where({ id: req.params.id })
    .update({
      slug: slug?.trim(),
      name: name?.trim(),
      icon: icon?.trim() || null,
      summary: summary?.trim() || null,
      details: details?.trim() || null,
      starting_price: starting_price?.trim() || null,
      order_index: Number(order_index) || 0,
      is_active: is_active === "on",
      updated_at: db.fn.now(),
    });
  res.redirect("/admin/services");
});

router.post("/services/:id/delete", verifyCsrfToken, async (req, res) => {
  await db("services").where({ id: req.params.id }).del();
  res.redirect("/admin/services");
});

/* ---------------------------------------------------------------- *
 * Team members
 * ---------------------------------------------------------------- */
router.get("/team", async (req, res) => {
  const team = await db("team_members").orderBy("order_index");
  res.render("admin/team", { admin: req.session.admin, team, editing: null });
});

router.get("/team/:id/edit", async (req, res) => {
  const member = await db("team_members").where({ id: req.params.id }).first();
  if (!member) return res.redirect("/admin/team");
  const team = await db("team_members").orderBy("order_index");
  res.render("admin/team", { admin: req.session.admin, team, editing: member });
});

router.post("/team", verifyCsrfToken, async (req, res) => {
  const { name, role, initials, founder, accent, bio, order_index } = req.body;
  if (!name || !role) return res.redirect("/admin/team");
  await db("team_members").insert({
    name: name.trim(),
    role: role.trim(),
    initials: initials?.trim() || null,
    founder: founder === "on",
    accent: accent?.trim() || null,
    bio: bio?.trim() || null,
    order_index: Number(order_index) || 0,
  });
  res.redirect("/admin/team");
});

router.post("/team/:id", verifyCsrfToken, async (req, res) => {
  const { name, role, initials, founder, accent, bio, order_index, is_active } = req.body;
  await db("team_members")
    .where({ id: req.params.id })
    .update({
      name: name?.trim(),
      role: role?.trim(),
      initials: initials?.trim() || null,
      founder: founder === "on",
      accent: accent?.trim() || null,
      bio: bio?.trim() || null,
      order_index: Number(order_index) || 0,
      is_active: is_active === "on",
      updated_at: db.fn.now(),
    });
  res.redirect("/admin/team");
});

router.post("/team/:id/delete", verifyCsrfToken, async (req, res) => {
  await db("team_members").where({ id: req.params.id }).del();
  res.redirect("/admin/team");
});

/* ---------------------------------------------------------------- *
 * Feedback moderation
 * ---------------------------------------------------------------- */
router.get("/feedback", async (req, res) => {
  const comments = await db("comments").orderBy("submitted_at", "desc");
  res.render("admin/feedback", { admin: req.session.admin, comments });
});

router.post("/feedback/:id/toggle", verifyCsrfToken, async (req, res) => {
  const comment = await db("comments").where({ id: req.params.id }).first();
  if (comment) {
    await db("comments").where({ id: req.params.id }).update({ is_approved: !comment.is_approved });
  }
  res.redirect("/admin/feedback");
});

router.post("/feedback/:id/delete", verifyCsrfToken, async (req, res) => {
  await db("comments").where({ id: req.params.id }).del();
  res.redirect("/admin/feedback");
});

/* ---------------------------------------------------------------- *
 * Users
 * ---------------------------------------------------------------- */
router.get("/users", async (req, res) => {
  const users = await db("users").select("id", "name", "email", "role", "created_at").orderBy("id");
  res.render("admin/users", { admin: req.session.admin, users, error: null });
});

router.post("/users/:id/role", verifyCsrfToken, async (req, res) => {
  const { role } = req.body;
  if (role !== "user" && role !== "admin") return res.redirect("/admin/users");
  if (Number(req.params.id) === req.session.admin.id) return res.redirect("/admin/users");
  await db("users").where({ id: req.params.id }).update({ role });
  res.redirect("/admin/users");
});

router.post("/users/:id/delete", verifyCsrfToken, async (req, res) => {
  if (Number(req.params.id) === req.session.admin.id) return res.redirect("/admin/users");
  await db("users").where({ id: req.params.id }).del();
  res.redirect("/admin/users");
});

module.exports = router;
