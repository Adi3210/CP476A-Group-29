# Milestone 2 Database Design

## Core entities

- `users`: stores requesters/agents/admins.
- `tickets`: stores help-desk tickets and ownership.
- `comments`: stores ticket discussion entries.
- `ticket_status_history`: stores status changes for auditability.

## Relationships

- One `user` can request many `tickets` (`tickets.requester_id`).
- One `user` can be assigned many `tickets` (`tickets.assignee_id`).
- One `ticket` can have many `comments`.
- One `ticket` can have many `ticket_status_history` entries.

## Normalization notes

- Ticket comments are separated from `tickets` (1:N) to avoid repeating comment columns.
- Status transitions are separated into `ticket_status_history` for cleaner audit data.
- User identity data is stored once in `users` and referenced by foreign keys.

## SQL file

- Full `CREATE TABLE` statements are in `docs/database_schema.sql`.
