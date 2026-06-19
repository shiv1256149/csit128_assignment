const path = require("path");
const { timeline } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("timeline").del();
  await knex("timeline").insert(
    timeline.map((t, i) => ({
      year: t.year,
      milestone: t.milestone,
      detail: t.detail,
      order_index: i,
    }))
  );
};
