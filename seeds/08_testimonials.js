const path = require("path");
const { testimonials } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("testimonials").del();
  await knex("testimonials").insert(
    testimonials.map((t, i) => ({
      name: t.name,
      role: t.role,
      company: t.company,
      rating: t.rating,
      quote: t.quote,
      order_index: i,
    }))
  );
};
