const express = require('express')
const app = express();

const PORT = process.env.PORT || 3000;


// Midleware
app.use(express.json());






app.listen(PORT, ()=>console.log(`server is runnig on port ${PORT}`));


