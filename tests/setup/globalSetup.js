require("dotenv").config({ quiet: true });
const knexLib = require("knex");
const knexfile = require("../../knexfile");

// reset test schema once before suite: rollback + migrate + seed, no stale data
module.exports = async () => {
  const db = knexLib(knexfile.test);
  await db.migrate.rollback({}, true);
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
};
