# CP476A Group 29 - Ticketing System

Help Desk / Ticketing System project for `CP476A - Internet Computing (Winter 2026)`.

## Team
- Sara Aljaafari
- Amelie Chu Moy Sang
- Efetobore Salubi

## Milestone 1
### Project description
Teams, small businesses, and student groups often lack a simple, centralized system to manage internal issues and support requests. This project provides a lightweight web-based ticketing platform.

### Main features
- View list of all support tickets
- Create a new support ticket
- View ticket details
- Add comments to a ticket
- Assign an agent to a ticket
- Change ticket status and priority

### Screens / wireframes
- Ticket List (Dashboard)
- Create Ticket
- Ticket Details

## Milestone 2
### Scope
- Working front-end for login, dashboard, create ticket, and ticket details.
- Local mock workflow for creating tickets and adding comments.
- Runnable Node.js backend skeleton with route modules.
- Relational schema package with SQL `CREATE TABLE` statements.

## Repo structure
- `frontend/` - static UI pages (`index`, `dashboard`, `create-ticket`, `ticket-details`)
- `backend/` - Node.js API skeleton (`server.js` + routes)
- `docs/` - milestone documentation artifacts (`database_schema.sql`, activity log)

## Run locally

### Front-end
1. Open `frontend/index.html` in your browser.
2. Sign in to navigate to dashboard.
3. Create and view tickets using browser local storage.

### Back-end
1. Open a terminal at repo root.
2. Run `cd backend`
3. Run `npm install`
4. Run `npm start`
5. API base URL: `http://localhost:3000/api`

## API routes (Milestone 2 skeleton)
- `GET /api/health`
- `GET /api/tickets`
- `GET /api/tickets/:ticketId`
- `POST /api/tickets`
- `PATCH /api/tickets/:ticketId`
- `DELETE /api/tickets/:ticketId`
- `GET /api/tickets/:ticketId/comments`
- `POST /api/tickets/:ticketId/comments`
- `GET /api/users`

## Database design artifacts
- `docs/database_design.md`
- `docs/database_schema.sql`

## Milestone 2 team work
- Front-end workflow updates and validation: Sara Aljaafari
- Database schema + SQL constraints: Amelie Chu Moy Sang
- Backend route skeleton and server setup: Efetobore Salubi
