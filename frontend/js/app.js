const STORAGE_KEY = "tickets";
const COMMENTS_STORAGE_KEY = "ticket_comments";

const DEFAULT_TICKETS = [
  {
    id: "T-1042",
    title: "Cannot login",
    status: "Open",
    priority: "High",
    category: "Support",
    updated: "2026-02-26T14:12:00.000Z",
    description: "User enters correct credentials but is redirected back to login."
  },
  {
    id: "T-1043",
    title: "Bug in form validation",
    status: "In Progress",
    priority: "Medium",
    category: "Bug",
    updated: "2026-02-25T16:08:00.000Z",
    description: "Create ticket form fails when user enters special characters."
  },
  {
    id: "T-1044",
    title: "Request: add dark mode",
    status: "Closed",
    priority: "Low",
    category: "Request",
    updated: "2026-02-24T09:20:00.000Z",
    description: "User requested an optional dark mode for the dashboard."
  }
];

const DEFAULT_COMMENTS_BY_TICKET = {
  "T-1042": [
    {
      id: 1,
      author: "Admin",
      message: "Can you share a screenshot?",
      createdAt: "2026-02-26T15:10:00.000Z"
    },
    {
      id: 2,
      author: "User",
      message: "It happens on Chrome and Edge.",
      createdAt: "2026-02-26T15:40:00.000Z"
    }
  ]
};

function loadFromStorage(key, fallbackValue) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallbackValue));
    return structuredClone(fallbackValue);
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) {
      throw new Error("Invalid storage value");
    }
    return parsed;
  } catch {
    localStorage.setItem(key, JSON.stringify(fallbackValue));
    return structuredClone(fallbackValue);
  }
}

function loadTickets() {
  return loadFromStorage(STORAGE_KEY, DEFAULT_TICKETS);
}

function saveTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function loadCommentsByTicket() {
  return loadFromStorage(COMMENTS_STORAGE_KEY, DEFAULT_COMMENTS_BY_TICKET);
}

function saveCommentsByTicket(commentsByTicket) {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByTicket));
}

function generateNextId(tickets) {
  let maxNum = 1000;
  tickets.forEach((ticket) => {
    const matched = String(ticket.id).match(/T-(\d+)/);
    if (matched) {
      maxNum = Math.max(maxNum, parseInt(matched[1], 10));
    }
  });
  return `T-${maxNum + 1}`;
}

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized === "open") {
    return "open";
  }
  if (normalized === "in progress" || normalized === "inprogress") {
    return "inprogress";
  }
  return "closed";
}

function humanDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value || "");
  }
  return parsed.toLocaleString();
}

function renderDashboard() {
  const tbody = document.getElementById("ticketsBody");
  if (!tbody) {
    return;
  }

  const tickets = loadTickets();
  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No tickets yet. Create one to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = tickets
    .map(
      (ticket) => `
        <tr>
          <td><a href="./ticket-details.html?id=${encodeURIComponent(ticket.id)}">${escapeHtml(ticket.id)}</a></td>
          <td>${escapeHtml(ticket.title)}</td>
          <td><span class="pill ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span></td>
          <td>${escapeHtml(ticket.priority)}</td>
          <td>${escapeHtml(ticket.category || "-")}</td>
          <td>${escapeHtml(humanDate(ticket.updated))}</td>
        </tr>
      `
    )
    .join("");
}

function showCreateTicketError(message) {
  const errorEl = document.getElementById("createTicketError");
  if (!errorEl) {
    return;
  }
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function validateCreateTicketForm({ title, description, priority, category }) {
  if (title.length < 5 || title.length > 120) {
    return "Title must be between 5 and 120 characters.";
  }
  if (description.length < 10 || description.length > 2000) {
    return "Description must be between 10 and 2000 characters.";
  }
  if (!["Low", "Medium", "High"].includes(priority)) {
    return "Please choose a valid priority.";
  }
  if (!["Bug", "Request", "Support"].includes(category)) {
    return "Please choose a valid category.";
  }
  return "";
}

function renderTicketDetails() {
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("id");
  const titleEl = document.getElementById("ticketTitle");
  const descEl = document.getElementById("ticketDesc");
  const metaEl = document.getElementById("ticketMeta");
  const commentsListEl = document.getElementById("commentsList");

  if (!ticketId || !titleEl || !descEl || !metaEl || !commentsListEl) {
    return;
  }

  const tickets = loadTickets();
  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket) {
    titleEl.textContent = "Ticket not found";
    descEl.textContent = "This ticket id does not exist in local storage.";
    metaEl.textContent = "";
    commentsListEl.innerHTML = "";
    return;
  }

  titleEl.textContent = `${ticket.id} - ${ticket.title}`;
  descEl.textContent = ticket.description || "";
  metaEl.textContent = `${ticket.status} | ${ticket.priority} | ${ticket.category || "Uncategorized"} | Updated: ${humanDate(ticket.updated)}`;

  const commentsByTicket = loadCommentsByTicket();
  const comments = commentsByTicket[ticket.id] || [];

  if (comments.length === 0) {
    commentsListEl.innerHTML = `<li class="muted">No comments yet.</li>`;
    return;
  }

  commentsListEl.innerHTML = comments
    .map((comment) => {
      return `<li><strong>${escapeHtml(comment.author)}:</strong> ${escapeHtml(comment.message)} <span class="muted">(${escapeHtml(humanDate(comment.createdAt))})</span></li>`;
    })
    .join("");
}

function showCommentError(message) {
  const errorEl = document.getElementById("commentError");
  if (!errorEl) {
    return;
  }
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function handleCreateTicketSubmit(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "");
  const category = String(formData.get("category") || "");

  const validationError = validateCreateTicketForm({ title, description, priority, category });
  if (validationError) {
    showCreateTicketError(validationError);
    return;
  }

  showCreateTicketError("");
  const tickets = loadTickets();
  const newTicket = {
    id: generateNextId(tickets),
    title,
    status: "Open",
    priority,
    category,
    updated: new Date().toISOString(),
    description
  };
  tickets.unshift(newTicket);
  saveTickets(tickets);

  window.location.href = "./dashboard.html";
}

function handleAddCommentSubmit(form) {
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("id");
  if (!ticketId) {
    return;
  }

  const formData = new FormData(form);
  const author = String(formData.get("author") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (author.length < 2 || author.length > 80) {
    showCommentError("Name must be between 2 and 80 characters.");
    return;
  }
  if (message.length < 2 || message.length > 1000) {
    showCommentError("Comment must be between 2 and 1000 characters.");
    return;
  }

  showCommentError("");
  const commentsByTicket = loadCommentsByTicket();
  const comments = commentsByTicket[ticketId] || [];
  const nextCommentId = comments.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1;

  comments.push({
    id: nextCommentId,
    author,
    message,
    createdAt: new Date().toISOString()
  });
  commentsByTicket[ticketId] = comments;
  saveCommentsByTicket(commentsByTicket);

  const tickets = loadTickets();
  const ticket = tickets.find((item) => item.id === ticketId);
  if (ticket) {
    ticket.updated = new Date().toISOString();
    saveTickets(tickets);
  }

  form.reset();
  renderTicketDetails();
}

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (form.id === "loginForm") {
    event.preventDefault();
    window.location.href = "./pages/dashboard.html";
  }

  if (form.id === "createTicketForm") {
    event.preventDefault();
    handleCreateTicketSubmit(form);
  }

  if (form.id === "addCommentForm") {
    event.preventDefault();
    handleAddCommentSubmit(form);
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderTicketDetails();
});
