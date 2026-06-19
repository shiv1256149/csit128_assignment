const NAME_PATTERN = /^[A-Za-zЀ-ӿ\s'.-]{2,60}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidName(name) {
  return typeof name === "string" && NAME_PATTERN.test(name.trim());
}

function isValidEmail(email) {
  return typeof email === "string" && EMAIL_PATTERN.test(email.trim()) && email.length <= 190;
}

// 8+ chars, 1 letter + 1 digit; no symbol requirement (don't punish passphrases)
function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function isValidRating(rating) {
  const n = Number(rating);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

module.exports = { isValidName, isValidEmail, isValidPassword, isValidRating };
