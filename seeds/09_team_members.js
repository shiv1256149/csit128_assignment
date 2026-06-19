const path = require("path");
const { team } = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("team_members").del();
  await knex("team_members").insert(
    team.map((m, i) => ({
      name: m.name,
      role: m.role,
      initials: m.initials,
      founder: !!m.founder,
      accent: m.accent,
      bio: m.bio,
      order_index: i,
    }))
  );
};
