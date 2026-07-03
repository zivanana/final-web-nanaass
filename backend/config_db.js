// config_db.js — Neon.tech PostgreSQL
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
