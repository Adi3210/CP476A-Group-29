
const express = require("express");
const { store } = require("./utils");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ data: store.users, count: store.users.length });
});

module.exports = router;
