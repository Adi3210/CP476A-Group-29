
const express = require("express");
const ticketsRouter = require("./tickets");
const commentsRouter = require("./comments");
const usersRouter = require("./users");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ticketing-api",
    timestamp: new Date().toISOString()
  });
});

router.use("/tickets", ticketsRouter);
router.use("/tickets/:ticketId/comments", commentsRouter);
router.use("/users", usersRouter);

module.exports = router;
