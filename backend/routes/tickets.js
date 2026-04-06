
const express = require("express");
const pool = require("../db");
const { validateNewTicket, validateTicketPatch } = require("./utils");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const TICKET_SELECT = `
  SELECT t.ticket_id, t.ticket_code, t.title, t.description,
         t.status, t.priority, t.category,
         t.created_by, r.first_name AS created_by_first, r.last_name AS created_by_last,
         t.assigned_to, a.first_name AS assigned_to_first, a.last_name AS assigned_to_last,
         t.created_at, t.updated_at, t.resolved_at
  FROM tickets t
  LEFT JOIN users r ON t.created_by  = r.user_id
  LEFT JOIN users a ON t.assigned_to = a.user_id`;

function mapTicket(row) {
  return {
    id:              row.ticket_id,
    ticketCode:      row.ticket_code,
    title:           row.title,
    description:     row.description,
    status:          row.status,
    priority:        row.priority,
    category:        row.category,
    createdBy:       row.created_by,
    createdByName:   row.created_by_first ? `${row.created_by_first} ${row.created_by_last}` : null,
    assignedTo:      row.assigned_to || null,
    assignedToName:  row.assigned_to_first ? `${row.assigned_to_first} ${row.assigned_to_last}` : null,
    createdAt:       row.created_at  instanceof Date ? row.created_at.toISOString()  : row.created_at,
    updatedAt:       row.updated_at  instanceof Date ? row.updated_at.toISOString()  : row.updated_at,
    resolvedAt:      row.resolved_at instanceof Date ? row.resolved_at.toISOString() : (row.resolved_at || null)
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

    const createdBy = value.createdBy || req.user.userId;

    // Insert with placeholder, then set ticket_code from insertId
    const [result] = await pool.query(
      "INSERT INTO tickets (ticket_code, title, description, status, priority, category, created_by) VALUES ('PENDING', ?, ?, 'open', ?, ?, ?)",
      [value.title, value.description, value.priority, value.category, createdBy]
    );
    const ticketCode = `T-${1000 + result.insertId}`;
    await pool.query("UPDATE tickets SET ticket_code = ? WHERE ticket_id = ?", [ticketCode, result.insertId]);

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
      "SELECT ticket_id, status, priority, assigned_to FROM tickets WHERE ticket_id = ? OR ticket_code = ?",
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
    const setClauses = [];
    const params = [];

    if (value.title       !== undefined) { setClauses.push("title = ?");        params.push(value.title); }
    if (value.description !== undefined) { setClauses.push("description = ?");  params.push(value.description); }
    if (value.status      !== undefined) { setClauses.push("status = ?");       params.push(value.status); }
    if (value.priority    !== undefined) { setClauses.push("priority = ?");     params.push(value.priority); }
    if (value.assignedTo  !== undefined) { setClauses.push("assigned_to = ?");  params.push(value.assignedTo); }

    // Set resolved_at when status transitions to resolved
    if (value.status === "resolved" && existing[0].status !== "resolved") {
      setClauses.push("resolved_at = NOW()");
    } else if (value.status && value.status !== "resolved") {
      setClauses.push("resolved_at = NULL");
    }

    params.push(ticketId);
    await pool.query(`UPDATE tickets SET ${setClauses.join(", ")} WHERE ticket_id = ?`, params);

    // Record any changed fields in ticket_history
    const changedBy = req.user.userId;
    const historyEntries = [];
    if (value.status !== undefined && value.status !== existing[0].status) {
      historyEntries.push([ticketId, changedBy, "status", existing[0].status, value.status]);
    }
    if (value.priority !== undefined && value.priority !== existing[0].priority) {
      historyEntries.push([ticketId, changedBy, "priority", existing[0].priority, value.priority]);
    }
    if (value.assignedTo !== undefined && value.assignedTo !== existing[0].assigned_to) {
      historyEntries.push([ticketId, changedBy, "assigned_to",
        String(existing[0].assigned_to ?? ""),
        String(value.assignedTo)
      ]);
    }
    for (const entry of historyEntries) {
      await pool.query(
        "INSERT INTO ticket_history (ticket_id, changed_by, field_changed, old_value, new_value) VALUES (?, ?, ?, ?, ?)",
        entry
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
