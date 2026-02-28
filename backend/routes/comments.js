
const express = require("express");
const {
  store,
  nextNumericId,
  findTicketIndexByIdentifier,
  validateComment,
  nowIso
} = require("./utils");

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
  const ticketIndex = findTicketIndexByIdentifier(req.params.ticketId);
  if (ticketIndex < 0) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const ticketId = store.tickets[ticketIndex].id;
  const comments = store.comments.filter((comment) => comment.ticketId === ticketId);
  res.json({ data: comments, count: comments.length });
});

router.post("/", (req, res) => {
  const ticketIndex = findTicketIndexByIdentifier(req.params.ticketId);
  if (ticketIndex < 0) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const { errors, value } = validateComment(req.body || {});
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed.", details: errors });
    return;
  }

  const ticket = store.tickets[ticketIndex];
  const comment = {
    id: nextNumericId(store.comments),
    ticketId: ticket.id,
    authorId: null,
    authorName: value.authorName,
    message: value.message,
    createdAt: nowIso()
  };

  store.comments.push(comment);
  ticket.updatedAt = nowIso();
  res.status(201).json({ data: comment });
});

module.exports = router;
