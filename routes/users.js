const express = require("express");
const router = express.Router();
require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



// Route to add a new user

router.post("/", async (req, res) => {
  const {
    userId,
    userUsername,
    userChannelName,
    userChannelDescription,
    userProfileImgUrl,
    userChannelCoverImgUrl,
    userWalletAddress,
    userSubscriptions,
    userNumberOfSubscribers,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (
            userId, userUsername, userChannelName, userChannelDescription,
            userProfileImgUrl, userChannelCoverImgUrl, userWalletAddress,
            userSubscriptions, userNumberOfSubscribers
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
      [
        userId,
        userUsername,
        userChannelName,
        userChannelDescription,
        userProfileImgUrl,
        userChannelCoverImgUrl,
        userWalletAddress,
        userSubscriptions,
        userNumberOfSubscribers,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export the router to be used in index.js
module.exports = router;
