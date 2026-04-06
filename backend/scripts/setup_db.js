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
      user_id      INT AUTO_INCREMENT PRIMARY KEY,
      full_name    VARCHAR(100) NOT NULL,
      email        VARCHAR(255) NOT NULL UNIQUE,
      role         VARCHAR(20)  NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_users_role CHECK (role IN ('requester', 'agent', 'admin'))
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id    INT AUTO_INCREMENT PRIMARY KEY,
      ticket_code  VARCHAR(20) NOT NULL UNIQUE,
      title        VARCHAR(120) NOT NULL,
      description  TEXT NOT NULL,
      status       VARCHAR(20) NOT NULL DEFAULT 'Open',
      priority     VARCHAR(20) NOT NULL,
      category     VARCHAR(20) NOT NULL,
      requester_id INT NOT NULL,
      assignee_id  INT NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tickets_requester FOREIGN KEY (requester_id) REFERENCES users(user_id),
      CONSTRAINT fk_tickets_assignee  FOREIGN KEY (assignee_id)  REFERENCES users(user_id),
      CONSTRAINT chk_tickets_status   CHECK (status   IN ('Open', 'In Progress', 'Closed')),
      CONSTRAINT chk_tickets_priority CHECK (priority IN ('Low', 'Medium', 'High')),
      CONSTRAINT chk_tickets_category CHECK (category IN ('Bug', 'Request', 'Support'))
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id  INT NOT NULL,
      author_id  INT NULL,
      body       TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(user_id)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_status_history (
      history_id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id  INT NOT NULL,
      old_status VARCHAR(20) NOT NULL,
      new_status VARCHAR(20) NOT NULL,
      changed_by INT NULL,
      changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_history_ticket     FOREIGN KEY (ticket_id)  REFERENCES tickets(ticket_id) ON DELETE CASCADE,
      CONSTRAINT fk_history_user       FOREIGN KEY (changed_by) REFERENCES users(user_id),
      CONSTRAINT chk_history_old_status CHECK (old_status IN ('Open', 'In Progress', 'Closed')),
      CONSTRAINT chk_history_new_status CHECK (new_status IN ('Open', 'In Progress', 'Closed'))
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
    "INSERT INTO users (full_name, email, role, password_hash) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
    [
      "Student User", "student@example.com", "requester", hash,
      "Help Desk Agent", "agent@example.com", "agent", hash
    ]
  );
  console.log("Seeded users: student@example.com / password123, agent@example.com / password123");

  const [[student]] = await connection.query("SELECT user_id FROM users WHERE email = 'student@example.com'");
  const [[agent]]   = await connection.query("SELECT user_id FROM users WHERE email = 'agent@example.com'");

  await connection.query(
    `INSERT INTO tickets (ticket_code, title, description, status, priority, category, requester_id, assignee_id) VALUES
     (?, ?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "T-1001", "Cannot login",
      "User enters valid credentials but is redirected to login page.",
      "Open", "High", "Support", student.user_id, agent.user_id,

      "T-1002", "Validation bug on create form",
      "Special characters break title validation on create ticket form.",
      "In Progress", "Medium", "Bug", student.user_id, agent.user_id
    ]
  );
  console.log("Seeded 2 sample tickets.");

  const [[ticket1]] = await connection.query("SELECT ticket_id FROM tickets WHERE ticket_code = 'T-1001'");
  await connection.query(
    "INSERT INTO comments (ticket_id, author_id, body) VALUES (?, ?, ?)",
    [ticket1.ticket_id, agent.user_id, "Can you share a screenshot of the login error?"]
  );
  console.log("Seeded 1 sample comment.");

  await connection.end();
  console.log("Setup complete.");
}

setup().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
