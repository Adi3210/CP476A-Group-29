
const express = require("express");
const {
  store,
  nextNumericId,
  buildTicketCode,
  findTicketIndexByIdentifier,
  validateNewTicket,
  validateTicketPatch,
  nowIso
} = require("./utils");

const router = express.Router();

router.get("/", (req, res) => {
  let tickets = [...store.tickets];
  const { status, priority, search } = req.query;

  if (status) {
    const normalizedStatus = String(status).trim().toLowerCase();
    tickets = tickets.filter((ticket) => ticket.status.toLowerCase() === normalizedStatus);
  }

  if (priority) {
    const normalizedPriority = String(priority).trim().toLowerCase();
    tickets = tickets.filter((ticket) => ticket.priority.toLowerCase() === normalizedPriority);
  }

  if (search) {
    const query = String(search).trim().toLowerCase();
    tickets = tickets.filter((ticket) => {
      return (
        ticket.ticketCode.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query)
      );
    });
  }

  res.json({ data: tickets, count: tickets.length });
});

router.get("/:ticketId", (req, res) => {
  const ticketIndex = findTicketIndexByIdentifier(req.params.ticketId);
  if (ticketIndex < 0) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  res.json({ data: store.tickets[ticketIndex] });
});

router.post("/", (req, res) => {
  const { errors, value } = validateNewTicket(req.body || {});
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed.", details: errors });
    return;
  }

  const timestamp = nowIso();
  const ticket = {
    id: nextNumericId(store.tickets),
    ticketCode: buildTicketCode(),
    title: value.title,
    description: value.description,
    status: "Open",
    priority: value.priority,
    category: value.category,
    requesterId: value.requesterId,
    assigneeId: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  store.tickets.unshift(ticket);
  res.status(201).json({ data: ticket });
});

router.patch("/:ticketId", (req, res) => {
  const ticketIndex = findTicketIndexByIdentifier(req.params.ticketId);
  if (ticketIndex < 0) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const { errors, value } = validateTicketPatch(req.body || {});
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed.", details: errors });
    return;
  }

  const updatedTicket = {
    ...store.tickets[ticketIndex],
    ...value,
    updatedAt: nowIso()
  };
  store.tickets[ticketIndex] = updatedTicket;
  res.json({ data: updatedTicket });
});

router.delete("/:ticketId", (req, res) => {
  const ticketIndex = findTicketIndexByIdentifier(req.params.ticketId);
  if (ticketIndex < 0) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const [removedTicket] = store.tickets.splice(ticketIndex, 1);
  store.comments = store.comments.filter((comment) => comment.ticketId !== removedTicket.id);
  res.json({ data: removedTicket });
});

module.exports = router;
