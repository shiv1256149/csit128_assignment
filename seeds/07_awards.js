const path = require("path");
const { awards } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("awards").del();
  await knex("awards").insert(
    awards.map((a, i) => ({
      year: a.year,
      title: a.title,
      organisation: a.organisation,
      note: a.note,
      order_index: i,
    }))
  );
};
