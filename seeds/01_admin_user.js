const bcrypt = require("bcrypt");

exports.seed = async (knex) => {
  const email = (process.env.ADMIN_EMAIL || "admin@veyra.tech").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn("ADMIN_PASSWORD not set, skipping admin user seed.");
    return;
  }

  const existing = await knex("users").where({ email }).first();
  if (existing) return;

  const password_hash = await bcrypt.hash(password, 12);
  await knex("users").insert({
    name: "Admin",
    email,
    password_hash,
    role: "admin",
  });
};
