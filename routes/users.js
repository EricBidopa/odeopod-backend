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
    userEmail,
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
            userId, userEmail, userUsername, userChannelName, userChannelDescription,
            userProfileImgUrl, userChannelCoverImgUrl, userWalletAddress,
            userSubscriptions, userNumberOfSubscribers
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
      [
        userId,
        userEmail,
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
    res.status(500).json({ error: `Error inserting user: ${err.message}` });
  }
});

// Route to check if a username is already taken
router.get("/check-username-availability", async (req, res) => {
  const { userUsername } = req.query;

  try {
    const result = await pool.query(
      "SELECT 1 FROM users WHERE userUsername = $1 LIMIT 1",
      [userUsername.toLowerCase()]
    );

    if (result.rows.length > 0) {
      res.status(409).json({ error: "Username already used!" });
    } else {
      res.status(200).json({ message: "Username available" });
    }
  } catch (err) {
    res.status(500).json({ error: `Error checking username: ${err.message}` });
  }
});


// Route to update user's information in the users table in the database
// Route to update user's username
router.patch("/update-username/:userId", async (req, res) => {
    const { userId } = req.params;
    const { userUsername } = req.body;
  
    if (!userUsername) {
      return res.status(400).json({ error: "Username is required" });
    }
  
    try {
      const result = await pool.query(
        "UPDATE users SET userUsername = $1 WHERE userId = $2 RETURNING *",
        [userUsername.toLowerCase(), userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ message: "Username updated successfully", user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: `Error updating username: ${err.message}` });
    }
  });
  



module.exports = router;
