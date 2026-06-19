const path = require("path");
const { offices } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("offices").del();
  await knex("offices").insert(
    offices.map((o, i) => ({
      slug: o.id,
      city: o.city,
      country: o.country,
      role: o.role,
      opened: o.opened,
      address: o.address,
      blurb: o.blurb,
      order_index: i,
    }))
  );
};
