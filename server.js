require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

const apiRoutes = require("./src/routes/api");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 3010;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);

const PAGES = [
  "index",
  "about",
  "services",
  "products",
  "team",
  "feedback",
  "contact",
  "news",
  "register",
  "login",
];
PAGES.forEach((page) => {
  app.get("/" + (page === "index" ? "" : page), (_req, res) => {
    res.sendFile(path.join(__dirname, "public", page + ".html"));
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API endpoint." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Veyra Technologies site running at http://localhost:${PORT}`);
  });
}

module.exports = app;
