-- Ticketing System Database Schema
-- Milestone 3 – matches MS02 Database Design Package

CREATE TABLE users (
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
);

CREATE TABLE tickets (
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
);

CREATE TABLE comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  content     TEXT    NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ticket_id   INT NOT NULL,
  user_id     INT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id)   ON DELETE RESTRICT,
  INDEX idx_ticket_id  (ticket_id),
  INDEX idx_user_id    (user_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE ticket_history (
  history_id    INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT          NOT NULL,
  changed_by    INT          NOT NULL,
  field_changed VARCHAR(50)  NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)  REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(user_id)    ON DELETE RESTRICT,
  INDEX idx_ticket_id    (ticket_id),
  INDEX idx_changed_by   (changed_by),
  INDEX idx_changed_at   (changed_at),
  INDEX idx_field_changed (field_changed)
);
