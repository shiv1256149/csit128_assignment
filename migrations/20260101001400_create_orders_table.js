exports.up = (knex) =>
  knex.schema.createTable("orders", (t) => {
    t.increments("id").primary();
    t.integer("user_id").unsigned().notNullable().references("users.id").onDelete("CASCADE");
    t.enu("item_type", ["product", "service"]).notNullable();
    t.integer("item_id").unsigned().notNullable();
    t.string("item_name", 150).notNullable();
    t.string("item_price", 50);
    t.enu("status", ["pending", "fulfilled", "cancelled"]).notNullable().defaultTo("pending");
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists("orders");
