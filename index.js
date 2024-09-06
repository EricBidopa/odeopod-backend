const express = require("express");
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Midleware
app.use(bodyParser.json());

// Routes

app.use("/users", usersRouter); // Use the within which / is qual to /users users router

// Test to make sure backend is running
app.get("/", (req, res) => {
  res.send("OdeoPod backend running!");
});

app.listen(PORT, () => console.log(`server is runnig on port ${PORT}`));
