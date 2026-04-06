/**
 * setup_db.js
 * Creates the ticketing_db database, all tables, and seeds initial data.
 * Run once from the backend/ directory: node scripts/setup_db.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function setup() {
  const dbName = process.env.DB_NAME || "ticketing_db";

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  });

  console.log("Connected to MySQL.");

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.query(`USE \`${dbName}\``);
  console.log(`Using database: ${dbName}`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id    INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      first_name VARCHAR(50)  NOT NULL,
      last_name  VARCHAR(50)  NOT NULL,
      role       ENUM('admin', 'agent', 'submitter') NOT NULL DEFAULT 'submitter',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      is_active  BOOLEAN NOT NULL DEFAULT TRUE,
      INDEX idx_email (email),
      INDEX idx_role  (role)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id   INT AUTO_INCREMENT PRIMARY KEY,
      ticket_code VARCHAR(20)  NOT NULL UNIQUE,
      title       VARCHAR(200) NOT NULL,
      description TEXT         NOT NULL,
      status      ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
      priority    ENUM('low', 'medium', 'high', 'critical')         NOT NULL DEFAULT 'medium',
      category    ENUM('bug', 'feature_request', 'question', 'other') NOT NULL DEFAULT 'question',
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      created_by  INT NOT NULL,
      assigned_to INT NULL,
      FOREIGN KEY (created_by)  REFERENCES users(user_id) ON DELETE RESTRICT,
      FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
      INDEX idx_status      (status),
      INDEX idx_priority    (priority),
      INDEX idx_assigned_to (assigned_to),
      INDEX idx_created_by  (created_by),
      INDEX idx_created_at  (created_at)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id  INT AUTO_INCREMENT PRIMARY KEY,
      content     TEXT    NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ticket_id   INT NOT NULL,
      user_id     INT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)   REFERENCES users(user_id)    ON DELETE RESTRICT,
      INDEX idx_ticket_id  (ticket_id),
      INDEX idx_user_id    (user_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_history (
      history_id    INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id     INT         NOT NULL,
      changed_by    INT         NOT NULL,
      field_changed VARCHAR(50) NOT NULL,
      old_value     TEXT,
      new_value     TEXT,
      changed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id)  REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(user_id)    ON DELETE RESTRICT,
      INDEX idx_ticket_id     (ticket_id),
      INDEX idx_changed_by    (changed_by),
      INDEX idx_changed_at    (changed_at),
      INDEX idx_field_changed (field_changed)
    ) ENGINE=InnoDB
  `);

  console.log("Tables ready.");

  // Seed only if users table is empty
  const [[{ count }]] = await connection.query("SELECT COUNT(*) AS count FROM users");
  if (Number(count) > 0) {
    console.log("Seed data already present — skipping.");
    await connection.end();
    console.log("Setup complete.");
    return;
  }

  const hash = await bcrypt.hash("password123", 10);

  await connection.query(
    `INSERT INTO users (email, password, first_name, last_name, role) VALUES
     (?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?)`,
    [
      "student@example.com", hash, "Student", "User", "submitter",
      "agent@example.com",   hash, "Help Desk", "Agent", "agent"
    ]
  );
  console.log("Seeded users: student@example.com / password123, agent@example.com / password123");

  const [[student]] = await connection.query("SELECT user_id FROM users WHERE email = 'student@example.com'");
  const [[agent]]   = await connection.query("SELECT user_id FROM users WHERE email = 'agent@example.com'");

  await connection.query(
    `INSERT INTO tickets (ticket_code, title, description, status, priority, category, created_by, assigned_to) VALUES
     (?, ?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "T-1001", "Cannot login",
      "User enters valid credentials but is redirected to login page.",
      "open", "high", "question", student.user_id, agent.user_id,

      "T-1002", "Validation bug on create form",
      "Special characters break title validation on create ticket form.",
      "in_progress", "medium", "bug", student.user_id, agent.user_id
    ]
  );
  console.log("Seeded 2 sample tickets.");

  const [[ticket1]] = await connection.query("SELECT ticket_id FROM tickets WHERE ticket_code = 'T-1001'");
  await connection.query(
    "INSERT INTO comments (content, ticket_id, user_id) VALUES (?, ?, ?)",
    ["Can you share a screenshot of the login error?", ticket1.ticket_id, agent.user_id]
  );
  console.log("Seeded 1 sample comment.");

  await connection.end();
  console.log("Setup complete.");
}

setup().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
