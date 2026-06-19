require("dotenv").config({ quiet: true });

// fail fast on blank secrets, before route requires (they call session() at require-time)
const REQUIRED_ENV = ["JWT_SECRET", "SESSION_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(
    `Missing required environment variable(s): ${missingEnv.join(", ")}. Copy .env.example to .env and fill in real values.`
  );
}

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const apiRoutes = require("./src/routes/api");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 3010;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// style-src allows inline (pages use style="") attrs; script-src stays 'self'
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// no-op unless CORS_ORIGIN set (only needed for split frontend/backend hosting)
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

// request logs: console (visible via `docker compose logs`) + persisted file
if (process.env.NODE_ENV !== "test") {
  const logsDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  app.use(morgan("combined", { stream: fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" }) }));
  app.use(morgan("dev"));
}

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

// safety net: asyncHandler forwards errors here instead of crashing; never leak stack to client
app.use((err, req, res, _next) => {
  console.error(err);
  if (req.path.startsWith("/api")) {
    res.status(500).json({ error: "Internal server error." });
  } else {
    res.status(500).send("Internal server error.");
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Veyra Technologies site running at http://localhost:${PORT}`);
  });
}

module.exports = app;
