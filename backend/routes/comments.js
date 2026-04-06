
const express = require("express");
const pool = require("../db");
const { validateComment } = require("./utils");
const { requireAuth } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

function mapComment(row) {
  return {
    id:         row.comment_id,
    ticketId:   row.ticket_id,
    userId:     row.user_id,
    authorName: row.author_name || "Unknown",
    message:    row.content,
    isInternal: row.is_internal === 1 || row.is_internal === true,
    createdAt:  row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt:  row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

// GET /api/tickets/:ticketId/comments
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.ticketId;
    const [tickets] = await pool.query(
      "SELECT ticket_id FROM tickets WHERE ticket_id = ? OR ticket_code = ?",
      [id, id]
    );
    if (tickets.length === 0) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const [rows] = await pool.query(
      `SELECT c.comment_id, c.ticket_id, c.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS author_name,
              c.content, c.is_internal, c.created_at, c.updated_at
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.user_id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [tickets[0].ticket_id]
    );

    res.json({ data: rows.map(mapComment), count: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/:ticketId/comments
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.ticketId;
    const [tickets] = await pool.query(
      "SELECT ticket_id FROM tickets WHERE ticket_id = ? OR ticket_code = ?",
      [id, id]
    );
    if (tickets.length === 0) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const { errors, value } = validateComment(req.body || {});
    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed.", details: errors });
      return;
    }

    const ticketId  = tickets[0].ticket_id;
    const userId    = req.user.userId;
    const isInternal = req.body.isInternal === true || req.body.isInternal === "true" ? 1 : 0;

    const [result] = await pool.query(
      "INSERT INTO comments (content, is_internal, ticket_id, user_id) VALUES (?, ?, ?, ?)",
      [value.message, isInternal, ticketId, userId]
    );

    await pool.query(
      "UPDATE tickets SET updated_at = NOW() WHERE ticket_id = ?",
      [ticketId]
    );

    const [[comment]] = await pool.query(
      `SELECT c.comment_id, c.ticket_id, c.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS author_name,
              c.content, c.is_internal, c.created_at, c.updated_at
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.user_id
       WHERE c.comment_id = ?`,
      [result.insertId]
    );

    res.status(201).json({ data: mapComment(comment) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
