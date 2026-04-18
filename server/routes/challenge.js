const express = require("express");
const router = express.Router();
const { generateChallenge } = require("../utils/botProtection");

router.get("/", (req, res) => {
  const challenge = generateChallenge(req.ip);
  if (!challenge) {
    return res
      .status(503)
      .json({ error: "Too many pending challenges. Try again later." });
  }
  res.json(challenge);
});

module.exports = router;
