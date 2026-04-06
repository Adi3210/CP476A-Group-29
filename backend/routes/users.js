
const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, full_name, email, role, created_at FROM users ORDER BY user_id ASC"
    );
    res.json({
      data: rows.map((u) => ({
        id: u.user_id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at
      })),
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
