require("dotenv").config({ quiet: true });
const db = require("../src/db");

// seed only if users table empty, so admin edits survive restarts
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
