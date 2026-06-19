const knexLib = require("knex");
const knexfile = require("../knexfile");

const env = process.env.NODE_ENV || "development";
const db = knexLib(knexfile[env]);

module.exports = db;
