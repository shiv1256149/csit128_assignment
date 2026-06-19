const path = require("path");
const { services } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("services").del();
  await knex("services").insert(
    services.map((s, i) => ({
      slug: s.id,
      name: s.name,
      icon: s.icon,
      summary: s.summary,
      details: s.details,
      starting_price: s.startingPrice,
      order_index: i,
    }))
  );
};
