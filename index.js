const express = require("express");
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
require("dotenv").config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Midleware
app.use(bodyParser.json());
// to enable backend to be access from all or specific origin
app.use(cors());

// Routes

app.use("/api/v1/users", usersRouter); // Use the within which / is qual to /users users router


// Test to make sure backend is running
app.get("/", (req, res) => {
  res.send("OdeoPod backend is running here!");
});

app.listen(PORT, '0.0.0.0', () => console.log(`server is runnig on port ${PORT}`));
