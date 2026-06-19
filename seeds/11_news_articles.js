// seeded from the legacy public/data/news.xml press releases
const RELEASES = [
  {
    slug: "b-series",
    title: "Veyra closes Series B to accelerate global expansion",
    category: "Company",
    summary:
      "The funding will fund two new availability regions and double the size of the platform engineering team over the next year.",
    published_at: "2026-05-14",
  },
  {
    slug: "console-v3",
    title: "Developer console v3 is now generally available",
    category: "Product",
    summary:
      "A ground-up rebuild of the console brings faster navigation, dark mode, and a redesigned billing dashboard to every customer.",
    published_at: "2026-03-02",
  },
  {
    slug: "austin",
    title: "Americas region goes live in Austin, Texas",
    category: "Infrastructure",
    summary:
      "Our fifth region brings single-digit-millisecond latency to customers across North America and completes our three-continent footprint.",
    published_at: "2025-11-19",
  },
  {
    slug: "observability",
    title: "Observability Suite adds distributed tracing",
    category: "Product",
    summary:
      "Teams can now follow a request across services end to end, with traces linked directly to the relevant logs and metrics.",
    published_at: "2025-07-08",
  },
  {
    slug: "iso",
    title: "Veyra achieves ISO 27001 certification",
    category: "Security",
    summary:
      "An independent audit confirms our information-security management system meets the international ISO 27001 standard.",
    published_at: "2025-02-21",
  },
];

exports.seed = async (knex) => {
  await knex("news_articles").del();
  await knex("news_articles").insert(
    RELEASES.map((r, i) => ({ ...r, order_index: i }))
  );
};
