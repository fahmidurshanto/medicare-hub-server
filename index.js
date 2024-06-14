const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Home route
app.get("/", (req, res) => {
  res.send("Hello from Medicare Hub Server");
});

app.listen(port, (req, res) => {
  console.log(`Server is running on port ${port}`);
});
