exports.up = (knex) =>
  knex.schema.createTable("news_articles", (t) => {
    t.increments("id").primary();
    t.string("slug", 60).notNullable().unique();
    t.string("title", 200).notNullable();
    t.string("category", 80);
    t.text("summary");
    t.date("published_at").notNullable();
    t.boolean("is_active").notNullable().defaultTo(true);
    t.integer("order_index").notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists("news_articles");
