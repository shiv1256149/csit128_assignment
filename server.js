/* =====================================================================
 * server.js  -  Veyra Technologies company profile web application
 * ---------------------------------------------------------------------
 * A small Node.js + Express back end. Its job is to:
 *   1. Serve the static front end (HTML, CSS, JS, images) from /public.
 *   2. Expose a read-only REST API that returns company data which the
 *      browser fetches and renders dynamically (the JSON file acts as
 *      our database).
 *   3. Accept customer comments from the feedback form, validate them
 *      on the server, and persist them to data/comments.json.
 *
 * The assignment allows either MySQL or a JSON file as the data store.
 * We use JSON files so the project runs anywhere with zero database
 * setup. The data-access functions below are deliberately isolated so
 * they could be swapped for MySQL queries without touching the routes.
 * ===================================================================== */

const express = require("express");
const json = require("express").json;
const join = require("path").join;
const readFileSync = require("fs").readFileSync;
const writeFileSync = require("fs").writeFileSync;

const app = express();
const PORT = process.env.PORT || 3010;

// Absolute paths to the two JSON "tables" we read from / write to.
const DATA_DIR = join(__dirname, "data");
const COMPANY_FILE = join(DATA_DIR, "company.json");
const COMMENTS_FILE = join(DATA_DIR, "comments.json");

/* ---------------------------------------------------------------------
 * Middleware
 * ------------------------------------------------------------------- */
// Parse incoming JSON request bodies (used by the comments endpoint).
app.use(json());

// Serve everything inside /public as static files (HTML/CSS/JS/images).
app.use(express.static(join(__dirname, "public")));

/* ---------------------------------------------------------------------
 * Data-access helpers  (this is the only place that touches the files,
 * so switching to MySQL later would only change these functions)
 * ------------------------------------------------------------------- */

// Read and parse the company data store. Returns a JavaScript object.
function readCompanyData() {
  const raw = readFileSync(COMPANY_FILE, "utf-8");
  return JSON.parse(raw);
}

// Read all stored comments. If the file does not exist yet, start empty.
function readComments() {
  try {
    const raw = readFileSync(COMMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return []; // No comments saved yet.
  }
}

// Append a new comment to the store and write it back to disk.
function saveComment(comment) {
  const comments = readComments();
  comments.unshift(comment); // newest first
  writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
  return comment;
}

/* ---------------------------------------------------------------------
 * REST API routes  (the front end calls these with fetch())
 * ------------------------------------------------------------------- */

// GET /api/company  ->  core company profile, history, stats.
app.get("/api/company", (_req, res) => {
  try {
    const data = readCompanyData();
    res.json({ company: data.company, offices: data.offices });
  } catch (err) {
    res.status(500).json({ error: "Could not load company data." });
  }
});

// GET /api/timeline  ->  five-year progress timeline (rendered as a table).
app.get("/api/timeline", (_req, res) => {
  try {
    res.json(readCompanyData().timeline);
  } catch (err) {
    res.status(500).json({ error: "Could not load timeline." });
  }
});

// GET /api/services  ->  products and services offered.
app.get("/api/services", (_req, res) => {
  try {
    res.json(readCompanyData().services);
  } catch (err) {
    res.status(500).json({ error: "Could not load services." });
  }
});

// GET /api/awards  ->  awards the company has received.
app.get("/api/awards", (_req, res) => {
  try {
    res.json(readCompanyData().awards);
  } catch (err) {
    res.status(500).json({ error: "Could not load awards." });
  }
});

// GET /api/testimonials  ->  curated customer testimonials.
app.get("/api/testimonials", (_req, res) => {
  try {
    res.json(readCompanyData().testimonials);
  } catch (err) {
    res.status(500).json({ error: "Could not load testimonials." });
  }
});

// GET /api/team  ->  founders and staff.
app.get("/api/team", (_req, res) => {
  try {
    res.json(readCompanyData().team);
  } catch (err) {
    res.status(500).json({ error: "Could not load team." });
  }
});

// GET /api/comments  ->  comments left by visitors (newest first).
// Emails are stored but never exposed publicly.
app.get("/api/comments", (_req, res) => {
  const publicComments = readComments().map(({ email, ...rest }) => rest);
  res.json(publicComments);
});

/* ---------------------------------------------------------------------
 * POST /api/comments  ->  receive a comment from the feedback form.
 * The browser validates first, but we NEVER trust the client, so we
 * validate again here before saving (defence in depth).
 * ------------------------------------------------------------------- */
app.post("/api/comments", (req, res) => {
  const { name, email, rating, message } = req.body || {};
  const errors = [];

  // --- Server-side validation -------------------------------------
  const namePattern = /^[A-Za-z\u0400-\u04FF\s'.-]{2,60}$/; // letters incl. Cyrillic
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!name || !namePattern.test(name.trim())) {
    errors.push("A valid name (2-60 letters) is required.");
  }
  if (!email || !emailPattern.test(email.trim())) {
    errors.push("A valid email address is required.");
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.push("Rating must be a whole number between 1 and 5.");
  }
  if (!message || message.trim().length < 10 || message.trim().length > 500) {
    errors.push("Message must be between 10 and 500 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // --- Build a sanitised record and persist it --------------------
  const comment = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    rating: ratingNum,
    message: message.trim(),
    submittedAt: new Date().toISOString(),
  };

  try {
    saveComment(comment);
    // Do not echo the email back to other visitors for privacy.
    const { email: _omit, ...publicComment } = comment;
    return res.status(201).json({ ok: true, comment: publicComment });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      errors: ["Could not save your comment. Please try again."],
    });
  }
});

/* ---------------------------------------------------------------------
 * Friendly routes for the HTML pages (so /about works as well as
 * /about.html) and a catch-all 404 for unknown API paths.
 * ------------------------------------------------------------------- */
const PAGES = ["index", "about", "services", "team", "feedback", "news"];
PAGES.forEach((page) => {
  app.get("/" + (page === "index" ? "" : page), (_req, res) => {
    res.sendFile(join(__dirname, "public", page + ".html"));
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API endpoint." });
});

/* ---------------------------------------------------------------------
 * Start the server
 * ------------------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Veyra Technologies site running at http://localhost:${PORT}`);
});
