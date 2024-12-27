const express = require("express");
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
const podcastsRouter = require("./routes/podcasts")
require("dotenv").config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Midleware
app.use(bodyParser.json());
// to enable backend to be access from everywhere
// will resume work on you very soon, son! Trust me Well work begins tomorrow bro!
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes

app.use("/api/v1/users", usersRouter); // Use the within which / is qual to /users users router
app.use("/api/v1/podcasts", podcastsRouter); // Use the within which / is qual to /users users router

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Test to make sure backend is running
app.get("/", (req, res) => {
  res.send("OdeoPod backend is running here!");
});

app.listen(PORT, '0.0.0.0', () => console.log(`server is running on port ${PORT}`));
