
const express = require("express");
const pool = require("../db");
const { validateNewTicket, validateTicketPatch } = require("./utils");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const TICKET_SELECT = `
  SELECT t.ticket_id, t.ticket_code, t.title, t.description,
         t.status, t.priority, t.category,
         t.requester_id, r.full_name AS requester_name,
         t.assignee_id, a.full_name AS assignee_name,
         t.created_at, t.updated_at
  FROM tickets t
  LEFT JOIN users r ON t.requester_id = r.user_id
  LEFT JOIN users a ON t.assignee_id = a.user_id`;

function mapTicket(row) {
  return {
    id: row.ticket_id,
    ticketCode: row.ticket_code,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    requesterId: row.requester_id,
    requesterName: row.requester_name || null,
    assigneeId: row.assignee_id || null,
    assigneeName: row.assignee_name || null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

// GET /api/tickets
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    let sql = TICKET_SELECT + " WHERE 1=1";
    const params = [];

    if (status) {
      sql += " AND LOWER(t.status) = LOWER(?)";
      params.push(status);
    }
    if (priority) {
      sql += " AND LOWER(t.priority) = LOWER(?)";
      params.push(priority);
    }
    if (search) {
      const like = `%${search}%`;
      sql += " AND (t.ticket_code LIKE ? OR t.title LIKE ? OR t.description LIKE ?)";
      params.push(like, like, like);
    }

    sql += " ORDER BY t.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ data: rows.map(mapTicket), count: rows.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:ticketId
router.get("/:ticketId", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.ticketId;
    const [rows] = await pool.query(
      TICKET_SELECT + " WHERE t.ticket_id = ? OR t.ticket_code = ?",
      [id, id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }
    res.json({ data: mapTicket(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { errors, value } = validateNewTicket(req.body || {});
    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed.", details: errors });
      return;
    }

    // Generate next ticket code from DB
    const [[{ maxNum }]] = await pool.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_code, 3) AS UNSIGNED)), 1000) AS maxNum FROM tickets WHERE ticket_code LIKE 'T-%'"
    );
    const ticketCode = `T-${maxNum + 1}`;

    const requesterId = value.requesterId || req.user.userId;

    const [result] = await pool.query(
      "INSERT INTO tickets (ticket_code, title, description, status, priority, category, requester_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ticketCode, value.title, value.description, "Open", value.priority, value.category, requesterId]
    );

    const [[ticket]] = await pool.query(
      TICKET_SELECT + " WHERE t.ticket_id = ?",
      [result.insertId]
    );
    res.status(201).json({ data: mapTicket(ticket) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:ticketId
router.patch("/:ticketId", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.ticketId;
    const [existing] = await pool.query(
      "SELECT ticket_id, status FROM tickets WHERE ticket_id = ? OR ticket_code = ?",
      [id, id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const { errors, value } = validateTicketPatch(req.body || {});
    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed.", details: errors });
      return;
    }

    const ticketId = existing[0].ticket_id;
    const oldStatus = existing[0].status;

    const setClauses = [];
    const params = [];
    if (value.title !== undefined) { setClauses.push("title = ?"); params.push(value.title); }
    if (value.description !== undefined) { setClauses.push("description = ?"); params.push(value.description); }
    if (value.status !== undefined) { setClauses.push("status = ?"); params.push(value.status); }
    if (value.priority !== undefined) { setClauses.push("priority = ?"); params.push(value.priority); }
    if (value.assigneeId !== undefined) { setClauses.push("assignee_id = ?"); params.push(value.assigneeId); }
    params.push(ticketId);

    await pool.query(`UPDATE tickets SET ${setClauses.join(", ")} WHERE ticket_id = ?`, params);

    // Record status change in audit history
    if (value.status && value.status !== oldStatus) {
      await pool.query(
        "INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
        [ticketId, oldStatus, value.status, req.user.userId]
      );
    }

    const [[updated]] = await pool.query(
      TICKET_SELECT + " WHERE t.ticket_id = ?",
      [ticketId]
    );
    res.json({ data: mapTicket(updated) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tickets/:ticketId
router.delete("/:ticketId", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.ticketId;
    const [existing] = await pool.query(
      "SELECT ticket_id FROM tickets WHERE ticket_id = ? OR ticket_code = ?",
      [id, id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const ticketId = existing[0].ticket_id;
    await pool.query("DELETE FROM tickets WHERE ticket_id = ?", [ticketId]);
    res.json({ data: { ticketId } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
