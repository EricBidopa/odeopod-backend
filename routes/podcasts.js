const express = require("express");
const router = express.Router();
require("dotenv").config();
const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Route to Add New Podcast
router.post("/", async (req, res) => {
  const {
    podcastTitle,
    podcastDescription,
    podcastDownloadUrl,
    podcastUploadedBy,
    podcastCoverImgUrl,
    podcastCreatedAt,
  } = req.body;

  // Input validation
  if (
    !podcastTitle ||
    !podcastDescription ||
    !podcastDownloadUrl ||
    !podcastUploadedBy ||
    !podcastCoverImgUrl ||
    !podcastCreatedAt
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO podcasts (
        podcastTitle, 
        podcastDescription, 
        podcastDownloadUrl, 
        podcastUploadedBy, 
        podcastCoverImgUrl, 
        podcastCreatedAt
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        podcastTitle,
        podcastDescription,
        podcastDownloadUrl,
        podcastUploadedBy,
        podcastCoverImgUrl,
        podcastCreatedAt,
      ]
    );

    // Send success response
    res.status(201).json({
      message: "Podcast added successfully!",
      podcast: result.rows[0],
    });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: `Error inserting podcast: ${err.message}` });
  }
});

module.exports = router;
