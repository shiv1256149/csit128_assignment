const crypto = require("crypto");

// session-bound CSRF token, hidden form field; csurf is archived, this replaces it
function attachCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function verifyCsrfToken(req, res, next) {
  const submitted = req.body && req.body._csrf;
  if (submitted && submitted === req.session.csrfToken) return next();
  return res.status(403).send("Invalid or missing CSRF token.");
}

module.exports = { attachCsrfToken, verifyCsrfToken };
