const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdminSession } = require("../middleware/adminAuth");
const { attachCsrfToken, verifyCsrfToken } = require("../middleware/csrf");

const router = express.Router();

// clamp to column width, avoids ER_DATA_TOO_LONG crashes
const clamp = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : value);

router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
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

router.post(
  "/login",
  loginLimiter,
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
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
  })
);

router.post("/logout", verifyCsrfToken, (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

router.use(requireAdminSession);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [{ count: products }] = await db("products").count("id as count");
    const [{ count: services }] = await db("services").count("id as count");
    const [{ count: team }] = await db("team_members").count("id as count");
    const [{ count: comments }] = await db("comments").count("id as count");
    const [{ count: users }] = await db("users").count("id as count");
    const [{ count: news }] = await db("news_articles").count("id as count");
    const [{ count: orders }] = await db("orders").count("id as count");
    const [{ count: contact }] = await db("contact_messages").count("id as count");

    res.render("admin/dashboard", {
      admin: req.session.admin,
      counts: { products, services, team, comments, users, news, orders, contact },
    });
  })
);

/* ---------------------------------------------------------------- *
 * Products
 * ---------------------------------------------------------------- */
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const products = await db("products").orderBy("order_index");
    res.render("admin/products", { admin: req.session.admin, products, editing: null });
  })
);

router.get(
  "/products/:id/edit",
  asyncHandler(async (req, res) => {
    const product = await db("products").where({ id: req.params.id }).first();
    if (!product) return res.redirect("/admin/products");
    const products = await db("products").orderBy("order_index");
    res.render("admin/products", { admin: req.session.admin, products, editing: product });
  })
);

router.post(
  "/products",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, name, category, description, price, image_url, order_index } = req.body;
    if (!slug || !name) return res.redirect("/admin/products");
    await db("products").insert({
      slug: clamp(slug, 60),
      name: clamp(name, 150),
      category: clamp(category, 80) || null,
      description: clamp(description, 2000) || null,
      price: clamp(price, 50) || null,
      image_url: clamp(image_url, 255) || null,
      order_index: Number(order_index) || 0,
    });
    res.redirect("/admin/products");
  })
);

router.post(
  "/products/:id",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, name, category, description, price, image_url, order_index, is_active } = req.body;
    await db("products")
      .where({ id: req.params.id })
      .update({
        slug: clamp(slug, 60),
        name: clamp(name, 150),
        category: clamp(category, 80) || null,
        description: clamp(description, 2000) || null,
        price: clamp(price, 50) || null,
        image_url: clamp(image_url, 255) || null,
        order_index: Number(order_index) || 0,
        is_active: is_active === "on",
        updated_at: db.fn.now(),
      });
    res.redirect("/admin/products");
  })
);

router.post(
  "/products/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("products").where({ id: req.params.id }).del();
    res.redirect("/admin/products");
  })
);

/* ---------------------------------------------------------------- *
 * Services
 * ---------------------------------------------------------------- */
router.get(
  "/services",
  asyncHandler(async (req, res) => {
    const services = await db("services").orderBy("order_index");
    res.render("admin/services", { admin: req.session.admin, services, editing: null });
  })
);

router.get(
  "/services/:id/edit",
  asyncHandler(async (req, res) => {
    const service = await db("services").where({ id: req.params.id }).first();
    if (!service) return res.redirect("/admin/services");
    const services = await db("services").orderBy("order_index");
    res.render("admin/services", { admin: req.session.admin, services, editing: service });
  })
);

router.post(
  "/services",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, name, icon, summary, details, starting_price, order_index } = req.body;
    if (!slug || !name) return res.redirect("/admin/services");
    await db("services").insert({
      slug: clamp(slug, 60),
      name: clamp(name, 150),
      icon: clamp(icon, 50) || null,
      summary: clamp(summary, 255) || null,
      details: clamp(details, 2000) || null,
      starting_price: clamp(starting_price, 50) || null,
      order_index: Number(order_index) || 0,
    });
    res.redirect("/admin/services");
  })
);

router.post(
  "/services/:id",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, name, icon, summary, details, starting_price, order_index, is_active } = req.body;
    await db("services")
      .where({ id: req.params.id })
      .update({
        slug: clamp(slug, 60),
        name: clamp(name, 150),
        icon: clamp(icon, 50) || null,
        summary: clamp(summary, 255) || null,
        details: clamp(details, 2000) || null,
        starting_price: clamp(starting_price, 50) || null,
        order_index: Number(order_index) || 0,
        is_active: is_active === "on",
        updated_at: db.fn.now(),
      });
    res.redirect("/admin/services");
  })
);

router.post(
  "/services/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("services").where({ id: req.params.id }).del();
    res.redirect("/admin/services");
  })
);

/* ---------------------------------------------------------------- *
 * News
 * ---------------------------------------------------------------- */
router.get(
  "/news",
  asyncHandler(async (req, res) => {
    const articles = await db("news_articles").orderBy("published_at", "desc");
    res.render("admin/news", { admin: req.session.admin, articles, editing: null });
  })
);

router.get(
  "/news/:id/edit",
  asyncHandler(async (req, res) => {
    const article = await db("news_articles").where({ id: req.params.id }).first();
    if (!article) return res.redirect("/admin/news");
    const articles = await db("news_articles").orderBy("published_at", "desc");
    res.render("admin/news", { admin: req.session.admin, articles, editing: article });
  })
);

router.post(
  "/news",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, title, category, summary, published_at, order_index } = req.body;
    if (!slug || !title || !published_at) return res.redirect("/admin/news");
    await db("news_articles").insert({
      slug: clamp(slug, 60),
      title: clamp(title, 200),
      category: clamp(category, 80) || null,
      summary: clamp(summary, 2000) || null,
      published_at,
      order_index: Number(order_index) || 0,
    });
    res.redirect("/admin/news");
  })
);

router.post(
  "/news/:id",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { slug, title, category, summary, published_at, order_index, is_active } = req.body;
    await db("news_articles")
      .where({ id: req.params.id })
      .update({
        slug: clamp(slug, 60),
        title: clamp(title, 200),
        category: clamp(category, 80) || null,
        summary: clamp(summary, 2000) || null,
        published_at,
        order_index: Number(order_index) || 0,
        is_active: is_active === "on",
        updated_at: db.fn.now(),
      });
    res.redirect("/admin/news");
  })
);

router.post(
  "/news/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("news_articles").where({ id: req.params.id }).del();
    res.redirect("/admin/news");
  })
);

/* ---------------------------------------------------------------- *
 * Team members
 * ---------------------------------------------------------------- */
router.get(
  "/team",
  asyncHandler(async (req, res) => {
    const team = await db("team_members").orderBy("order_index");
    res.render("admin/team", { admin: req.session.admin, team, editing: null });
  })
);

router.get(
  "/team/:id/edit",
  asyncHandler(async (req, res) => {
    const member = await db("team_members").where({ id: req.params.id }).first();
    if (!member) return res.redirect("/admin/team");
    const team = await db("team_members").orderBy("order_index");
    res.render("admin/team", { admin: req.session.admin, team, editing: member });
  })
);

router.post(
  "/team",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { name, role, initials, founder, accent, bio, order_index } = req.body;
    if (!name || !role) return res.redirect("/admin/team");
    await db("team_members").insert({
      name: clamp(name, 100),
      role: clamp(role, 150),
      initials: clamp(initials, 5) || null,
      founder: founder === "on",
      accent: clamp(accent, 10) || null,
      bio: clamp(bio, 2000) || null,
      order_index: Number(order_index) || 0,
    });
    res.redirect("/admin/team");
  })
);

router.post(
  "/team/:id",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { name, role, initials, founder, accent, bio, order_index, is_active } = req.body;
    await db("team_members")
      .where({ id: req.params.id })
      .update({
        name: clamp(name, 100),
        role: clamp(role, 150),
        initials: clamp(initials, 5) || null,
        founder: founder === "on",
        accent: clamp(accent, 10) || null,
        bio: clamp(bio, 2000) || null,
        order_index: Number(order_index) || 0,
        is_active: is_active === "on",
        updated_at: db.fn.now(),
      });
    res.redirect("/admin/team");
  })
);

router.post(
  "/team/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("team_members").where({ id: req.params.id }).del();
    res.redirect("/admin/team");
  })
);

/* ---------------------------------------------------------------- *
 * Contact requests
 * ---------------------------------------------------------------- */
router.get(
  "/contact",
  asyncHandler(async (req, res) => {
    const messages = await db("contact_messages").orderBy("submitted_at", "desc");
    res.render("admin/contact", { admin: req.session.admin, messages });
  })
);

router.post(
  "/contact/:id/toggle",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const msg = await db("contact_messages").where({ id: req.params.id }).first();
    if (msg) {
      await db("contact_messages").where({ id: req.params.id }).update({ is_read: !msg.is_read });
    }
    res.redirect("/admin/contact");
  })
);

router.post(
  "/contact/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("contact_messages").where({ id: req.params.id }).del();
    res.redirect("/admin/contact");
  })
);

/* ---------------------------------------------------------------- *
 * Feedback moderation
 * ---------------------------------------------------------------- */
router.get(
  "/feedback",
  asyncHandler(async (req, res) => {
    const comments = await db("comments").orderBy("submitted_at", "desc");
    res.render("admin/feedback", { admin: req.session.admin, comments });
  })
);

router.post(
  "/feedback/:id/toggle",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const comment = await db("comments").where({ id: req.params.id }).first();
    if (comment) {
      await db("comments").where({ id: req.params.id }).update({ is_approved: !comment.is_approved });
    }
    res.redirect("/admin/feedback");
  })
);

router.post(
  "/feedback/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("comments").where({ id: req.params.id }).del();
    res.redirect("/admin/feedback");
  })
);

/* ---------------------------------------------------------------- *
 * Orders
 * ---------------------------------------------------------------- */
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const orders = await db("orders")
      .join("users", "users.id", "orders.user_id")
      .orderBy("orders.created_at", "desc")
      .select(
        "orders.id",
        "orders.item_type",
        "orders.item_name",
        "orders.item_price",
        "orders.status",
        "orders.created_at",
        "users.name as buyer_name",
        "users.email as buyer_email"
      );
    res.render("admin/orders", { admin: req.session.admin, orders });
  })
);

router.post(
  "/orders/:id/status",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["pending", "fulfilled", "cancelled"].includes(status)) return res.redirect("/admin/orders");
    await db("orders").where({ id: req.params.id }).update({ status, updated_at: db.fn.now() });
    res.redirect("/admin/orders");
  })
);

router.post(
  "/orders/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    await db("orders").where({ id: req.params.id }).del();
    res.redirect("/admin/orders");
  })
);

/* ---------------------------------------------------------------- *
 * Users
 * ---------------------------------------------------------------- */
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await db("users").select("id", "name", "email", "role", "created_at").orderBy("id");
    res.render("admin/users", { admin: req.session.admin, users, error: null });
  })
);

router.post(
  "/users/:id/role",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (role !== "user" && role !== "admin") return res.redirect("/admin/users");
    if (Number(req.params.id) === req.session.admin.id) return res.redirect("/admin/users");
    await db("users").where({ id: req.params.id }).update({ role });
    res.redirect("/admin/users");
  })
);

router.post(
  "/users/:id/delete",
  verifyCsrfToken,
  asyncHandler(async (req, res) => {
    if (Number(req.params.id) === req.session.admin.id) return res.redirect("/admin/users");
    await db("users").where({ id: req.params.id }).del();
    res.redirect("/admin/users");
  })
);

module.exports = router;
