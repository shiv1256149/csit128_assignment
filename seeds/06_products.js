exports.seed = async (knex) => {
  await knex("products").del();
  await knex("products").insert([
    {
      slug: "edge-node",
      name: "Edge Node Appliance",
      category: "Hardware",
      description: "A pre-configured edge compute box for on-premise caching and local inference, shipped ready to rack.",
      price: "$1,200 one-time",
      order_index: 0,
    },
    {
      slug: "console-pro",
      name: "Developer Console Pro",
      category: "Software",
      description: "Team plan for the Veyra console: role-based access, audit logs, and unlimited projects.",
      price: "$29 / user / month",
      order_index: 1,
    },
    {
      slug: "backup-vault",
      name: "Backup Vault",
      category: "Storage",
      description: "Immutable, encrypted off-region backup storage with one-click restore for any Veyra database.",
      price: "from $0.01 / GB",
      order_index: 2,
    },
    {
      slug: "uptime-shield",
      name: "Uptime Shield SLA",
      category: "Support Plan",
      description: "Upgrade any plan to a 99.99% uptime SLA with a 15-minute incident response guarantee.",
      price: "$199 / month",
      order_index: 3,
    },
  ]);
};
