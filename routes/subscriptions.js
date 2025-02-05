const express = require("express");
const router = express.Router();
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Route to add a new subscription
router.post("/", async (req, res) => {
    const { subscriber_id, subscribedto_id } = req.body;
  
    try {
      const result = await pool.query(
        `INSERT INTO subscriptions (
          subscriber_id, subscribedto_id
        ) VALUES ($1, $2)
        RETURNING *`,
        [subscriber_id, subscribedto_id]
      );
      res.status(201).json(result.rows[0]); // Successfully inserted subscription
    } catch (err) {
      res.status(500).json({ error: `Error adding subscription: ${err.message}` });
    }
  });


  // Route to unscribscribe

  router.delete("/", async (req, res) => {
    const { subscriber_id, subscribedto_id } = req.body;
  
    try {
      const result = await pool.query(
        `DELETE FROM subscriptions 
         WHERE subscriber_id = $1 AND subscribedto_id = $2
         RETURNING *`,
        [subscriber_id, subscribedto_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }
  
      res.status(200).json({ message: "Successfully unsubscribed", subscription: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: `Error deleting subscription: ${err.message}` });
    }
  });
  
// Route to check subscription status
router.get("/status", async (req, res) => {
    const { subscriber_id, subscribedto_id } = req.query;
  
    try {
      const result = await pool.query(
        `SELECT * FROM subscriptions 
         WHERE subscriber_id = $1 AND subscribedto_id = $2`,
        [subscriber_id, subscribedto_id]
      );
  
      if (result.rowCount > 0) {
        res.status(200).json({ isSubscribed: true });
      } else {
        res.status(200).json({ isSubscribed: false });
      }
    } catch (err) {
      res.status(500).json({ error: `Error checking subscription status: ${err.message}` });
    }
  });


  
  
  
module.exports = router;
