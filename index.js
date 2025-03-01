const express = require("express");
const db = require("./db/db");  // Import the database connection
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
const podcastsRouter = require("./routes/podcasts");
const subscriptionsRouter = require("./routes/subscriptions");
require("dotenv").config();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Routes
app.use("/api/v1/users", usersRouter); // User-related routes
app.use("/api/v1/podcasts", podcastsRouter); // Podcast-related routes
app.use("/api/v1/subscriptions", subscriptionsRouter); // Subscription-related routes

// Test endpoint
app.get("/", (req, res) => {
  res.send("OdeoPod backend is running here!");
});

// Ensure DB connection before starting server
db.connect()
  .then(() => {
    console.log("Connected to Supabase PostgreSQL ✅");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
  })
  .catch(err => {
    console.error("Database connection error ❌", err);
    process.exit(1); // Exit if DB connection fails
  });
