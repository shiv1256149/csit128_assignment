const path = require("path");
const companyData = require(path.join(__dirname, "..", "data", "company.json"));

exports.seed = async (knex) => {
  await knex("company_history").del();
  await knex("company_stats").del();
  await knex("company_profile").del();

  const { company } = companyData;
  await knex("company_profile").insert({
    name: company.name,
    legal_name: company.legalName,
    tagline: company.tagline,
    founded: company.founded,
    headquarters: company.headquarters,
    email: company.email,
    phone: company.phone,
    mission: company.mission,
  });

  await knex("company_history").insert(
    company.history.map((paragraph, i) => ({ paragraph, order_index: i }))
  );

  await knex("company_stats").insert(
    company.stats.map((s, i) => ({ label: s.label, value: s.value, order_index: i }))
  );
};
