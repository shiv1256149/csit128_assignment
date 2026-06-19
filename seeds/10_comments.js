const path = require("path");
const comments = require(path.join(__dirname, "..", "data", "comments.json"));

exports.seed = async (knex) => {
  await knex("comments").del();
  await knex("comments").insert(
    comments.map((c) => ({
      name: c.name,
      email: c.email || "unknown@example.com",
      rating: c.rating,
      message: c.message,
      submitted_at: c.submittedAt ? new Date(c.submittedAt) : new Date(),
    }))
  );
};
