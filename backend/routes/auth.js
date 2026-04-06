
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const email    = String(req.body.email    || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const [rows] = await pool.query(
      "SELECT user_id, first_name, last_name, email, role, password FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Update last_login
    await pool.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [user.user_id]);

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: {
        id:        user.user_id,
        firstName: user.first_name,
        lastName:  user.last_name,
        name:      `${user.first_name} ${user.last_name}`,
        email:     user.email,
        role:      user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
