-- Ticketing System Database Schema
-- Milestone 3 – includes password_hash for authentication

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  role          VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('requester', 'agent', 'admin'))
);

CREATE TABLE tickets (
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
);

CREATE TABLE comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT NOT NULL,
  author_id  INT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(user_id)
);

CREATE TABLE ticket_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT NOT NULL,
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by INT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_ticket      FOREIGN KEY (ticket_id)  REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user        FOREIGN KEY (changed_by) REFERENCES users(user_id),
  CONSTRAINT chk_history_old_status CHECK (old_status IN ('Open', 'In Progress', 'Closed')),
  CONSTRAINT chk_history_new_status CHECK (new_status IN ('Open', 'In Progress', 'Closed'))
);
