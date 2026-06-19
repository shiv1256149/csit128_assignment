require("dotenv").config({ quiet: true });
const db = require("../src/db");

// Runs after migrations on every container start. Only seeds when the
// users table is empty, so admin edits made through the panel survive
// container restarts instead of being wiped by a re-seed.
(async () => {
  const row = await db("users").count("id as c").first();
  if (Number(row.c) === 0) {
    console.log("No users found, running seed...");
    await db.seed.run();
  } else {
    console.log("Existing data found, skipping seed.");
  }
  await db.destroy();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
