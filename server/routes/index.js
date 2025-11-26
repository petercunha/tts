const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send('<h2>Server Online</h2> Usage: <a href="/stats">/stats</a>');
});

module.exports = router;
