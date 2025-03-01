const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL connection
  },
});

// Test the connection
pool.connect()
  .then(() => console.log("Connected to Supabase PostgreSQL ✅"))
  .catch(err => console.error("Database connection error ❌", err));

module.exports = pool;
