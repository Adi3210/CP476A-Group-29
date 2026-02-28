const STORAGE_KEY = "tickets";

const DEFAULT_TICKETS = [
  {
    id: "T-1042",
    title: "Cannot login",
    status: "Open",
    priority: "High",
    updated: "Today",
    description: "User reports they enter correct credentials but are redirected back to login."
  },
  {
    id: "T-1043",
    title: "Bug in form validation",
    status: "In Progress",
    priority: "Medium",
    updated: "Yesterday",
    description: "Form fails when user enters special characters."
  },
  {
    id: "T-1044",
    title: "Request: add dark mode",
    status: "Closed",
    priority: "Low",
    updated: "2 days ago",
    description: "User would like a dark mode option for the UI."
  }
];

function loadTickets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKETS));
    return [...DEFAULT_TICKETS];
  }
  try {
    return JSON.parse(raw) || [];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKETS));
    return [...DEFAULT_TICKETS];
  }
}

function saveTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function generateNextId(tickets) {
  // find largest numeric part, then +1
  let maxNum = 1000;
  tickets.forEach(t => {
    const m = String(t.id).match(/T-(\d+)/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  return `T-${maxNum + 1}`;
}

function statusClass(status) {
  const s = status.toLowerCase();
  if (s === "open") return "open";
  if (s === "in progress" || s === "inprogress") return "inprogress";
  return "closed";
}

function renderDashboard() {
  const tbody = document.getElementById("ticketsBody");
  if (!tbody) return;

  const tickets = loadTickets();

  tbody.innerHTML = tickets
    .map(
      (t) => `
      <tr>
        <td><a href="./ticket-details.html?id=${encodeURIComponent(t.id)}">${t.id}</a></td>
        <td>${escapeHtml(t.title)}</td>
        <td><span class="pill ${statusClass(t.status)}">${escapeHtml(t.status)}</span></td>
        <td>${escapeHtml(t.priority)}</td>
        <td>${escapeHtml(t.updated)}</td>
      </tr>
    `
    )
    .join("");
}

// login + create ticket submit
document.addEventListener("submit", (e) => {
  const form = e.target;

  // login
  if (form.id === "loginForm") {
    e.preventDefault();
    window.location.href = "./pages/dashboard.html";
  }

  // create ticket
  if (form.id === "createTicketForm") {
    e.preventDefault();

    const formData = new FormData(form);
    const title = (formData.get("title") || "").toString().trim();
    const description = (formData.get("description") || "").toString().trim();
    const priority = (formData.get("priority") || "").toString();
    const category = (formData.get("category") || "").toString(); // optional for later

    const tickets = loadTickets();
    const newTicket = {
      id: generateNextId(tickets),
      title,
      status: "Open",
      priority,
      updated: "Just now",
      description,
      category
    };

    // Put newest ticket at the top
    tickets.unshift(newTicket);
    saveTickets(tickets);

    // go back to dashboard
    window.location.href = "./dashboard.html";
  }
});

// ticket details page
function renderTicketDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const titleEl = document.getElementById("ticketTitle");
  const descEl = document.getElementById("ticketDesc");

  if (!titleEl || !descEl) return;

  const tickets = loadTickets();
  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    titleEl.textContent = "Ticket not found";
    descEl.textContent = "This ticket id does not exist in local storage.";
    return;
  }

  titleEl.textContent = `${ticket.id} — ${ticket.title}`;
  descEl.textContent = ticket.description || "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Run renders on page load
document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderTicketDetails();
});