exports.up = (knex) =>
  knex.schema.createTable("contact_messages", (t) => {
    t.increments("id").primary();
    t.string("name", 100).notNullable();
    t.string("email", 190).notNullable();
    t.string("subject", 120).notNullable();
    t.text("message").notNullable();
    t.boolean("is_read").notNullable().defaultTo(false);
    t.timestamp("submitted_at").notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists("contact_messages");
