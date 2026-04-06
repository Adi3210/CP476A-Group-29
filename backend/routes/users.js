
const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, first_name, last_name, email, role, created_at, last_login, is_active FROM users ORDER BY user_id ASC"
    );
    res.json({
      data: rows.map((u) => ({
        id:        u.user_id,
        firstName: u.first_name,
        lastName:  u.last_name,
        name:      `${u.first_name} ${u.last_name}`,
        email:     u.email,
        role:      u.role,
        isActive:  u.is_active === 1 || u.is_active === true,
        lastLogin: u.last_login instanceof Date ? u.last_login.toISOString() : (u.last_login || null),
        createdAt: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at
      })),
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
