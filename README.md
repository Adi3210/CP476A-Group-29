# CP476A - Project - Group 29

Course project for CP476A. This repo holds the planning and code for a
ticket/booking system.

# Project Description:

Teams, small businesses, and student groups often lack a simple and centralized system to manage internal issues, tasks, and support requests.
As a result, they frequently rely on:

Email threads that become difficult to track and manage

Spreadsheets that do not support notifications or workflow management

Messaging platforms (such as Slack or Discord) where requests are easily lost in conversations

Physical boards that are not accessible to remote members

This leads to lost requests, unclear ownership, poor prioritization, and limited visibility into progress.

The Help Desk / Ticketing System aims to provide a lightweight, web-based solution for submitting, tracking, and managing requests in one centralized platform.

# Team Members & Roles

Sara Aljaafari - Wireframes, GitHub setup, project coordination

Amelie Chu Moy Sang - Project proposal, Team Plan

Efetobore Salubi - User stories, Data Planning

# Main features

View list of all support tickets

Create a new support ticket

View ticket details

Add comments to a ticket

Assign an agent to a ticket

Change ticket status and priority

# Screens / Wireframes

The system contains the following main screens:

Ticket List (Home)

Create Ticket

Ticket Details (View / Edit ticket information and comments)

Wireframes for these screens are included in the milestone submission.

# Repo Structure (Milestone 1)

Basic folders are in place for upcoming development:

- `frontend/` - UI client
- `backend/` - API + data access
- `docs/` - planning artifacts

# Planning Artifacts

Milestone 1 user stories and data planning are in:

- `docs/milestone1.txt`

# How to run locally

Basic steps to run the project on your machine (per Milestone 02 requirements).

**Front-end**

- Open the front-end in a browser: from the repo root, open `frontend/index.html` (or the main entry file) in a browser, or run a local static server from the `frontend/` directory (e.g. `npx serve frontend` or your course-approved method).
- If the front-end uses a build step, run the documented command from `frontend/` (e.g. `npm install` then `npm start` or `npm run dev`).

**Back-end**

- From the repo root: `cd backend`.
- Install dependencies (e.g. `npm install` for Node.js, or the equivalent for PHP).
- Start the server (e.g. `npm start` or `node server.js` for Node; `php -S localhost:8000` or your project’s command for PHP).
- The README in `backend/` or the project docs may specify the port and any environment variables.

# Project milestones

## Milestone 1

Project idea selection

Wireframes

GitHub repository setup

GitHub Projects Kanban board

Initial task assignment

## Milestone 2

- Working front-end (core screens, primary workflow; may use mock data).
- Database design package (ER diagram, SQL CREATE TABLE statements).
- Back-end setup (Node.js or PHP): project skeleton, runnable server entry point, initial routes/controllers (stubs allowed).
- Updated GitHub Projects Kanban and activity blog/wiki.
- README updated with steps to run front-end and back-end locally (see above).

## Milestone 3

- Full-stack integration, testing report, final demo and presentation.
