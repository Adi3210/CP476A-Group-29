
const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_STATUSES = ["Open", "In Progress", "Closed"];
const ALLOWED_CATEGORIES = ["Bug", "Request", "Support"];

const store = {
  users: [
    { id: 1, name: "Student User", email: "student@example.com", role: "requester" },
    { id: 2, name: "Help Desk Agent", email: "agent@example.com", role: "agent" }
  ],
  tickets: [
    {
      id: 1,
      ticketCode: "T-1001",
      title: "Cannot login",
      description: "User enters valid credentials but is redirected to login page.",
      status: "Open",
      priority: "High",
      category: "Support",
      requesterId: 1,
      assigneeId: 2,
      createdAt: "2026-02-20T14:35:00.000Z",
      updatedAt: "2026-02-20T14:35:00.000Z"
    },
    {
      id: 2,
      ticketCode: "T-1002",
      title: "Validation bug on create form",
      description: "Special characters break title validation on create ticket form.",
      status: "In Progress",
      priority: "Medium",
      category: "Bug",
      requesterId: 1,
      assigneeId: 2,
      createdAt: "2026-02-22T10:00:00.000Z",
      updatedAt: "2026-02-25T09:15:00.000Z"
    }
  ],
  comments: [
    {
      id: 1,
      ticketId: 1,
      authorId: 2,
      authorName: "Help Desk Agent",
      message: "Can you share a screenshot of the login error?",
      createdAt: "2026-02-20T15:10:00.000Z"
    }
  ]
};

function nextNumericId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1;
}

function buildTicketCode() {
  const highestTicketNumber = store.tickets.reduce((maxValue, ticket) => {
    const matched = String(ticket.ticketCode).match(/^T-(\d+)$/);
    if (!matched) {
      return maxValue;
    }
    return Math.max(maxValue, Number(matched[1]));
  }, 1000);
  return `T-${highestTicketNumber + 1}`;
}

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesEnum(value, allowedValues) {
  const normalizedInput = normalizeLabel(value);
  return allowedValues.find((item) => normalizeLabel(item) === normalizedInput) || null;
}

function findTicketIndexByIdentifier(identifier) {
  const value = String(identifier || "").trim();
  if (!value) {
    return -1;
  }
  return store.tickets.findIndex((ticket) => {
    return String(ticket.id) === value || normalizeLabel(ticket.ticketCode) === normalizeLabel(value);
  });
}

function validateNewTicket(payload) {
  const errors = [];
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const priority = matchesEnum(payload.priority, ALLOWED_PRIORITIES);
  const category = matchesEnum(payload.category, ALLOWED_CATEGORIES);

  if (title.length < 5 || title.length > 120) {
    errors.push("Title must be between 5 and 120 characters.");
  }

  if (description.length < 10 || description.length > 2000) {
    errors.push("Description must be between 10 and 2000 characters.");
  }

  if (!priority) {
    errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`);
  }

  if (!category) {
    errors.push(`Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`);
  }

  return {
    errors,
    value: {
      title,
      description,
      priority,
      category,
      requesterId: Number(payload.requesterId) || 1
    }
  };
}

function validateTicketPatch(payload) {
  const errors = [];
  const value = {};

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    const status = matchesEnum(payload.status, ALLOWED_STATUSES);
    if (!status) {
      errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(", ")}.`);
    } else {
      value.status = status;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "priority")) {
    const priority = matchesEnum(payload.priority, ALLOWED_PRIORITIES);
    if (!priority) {
      errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}.`);
    } else {
      value.priority = priority;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "assigneeId")) {
    const assigneeId = Number(payload.assigneeId);
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      errors.push("assigneeId must be a positive integer.");
    } else {
      value.assigneeId = assigneeId;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = String(payload.title || "").trim();
    if (title.length < 5 || title.length > 120) {
      errors.push("Title must be between 5 and 120 characters.");
    } else {
      value.title = title;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    const description = String(payload.description || "").trim();
    if (description.length < 10 || description.length > 2000) {
      errors.push("Description must be between 10 and 2000 characters.");
    } else {
      value.description = description;
    }
  }

  if (Object.keys(value).length === 0) {
    errors.push("At least one updatable field is required.");
  }

  return { errors, value };
}

function validateComment(payload) {
  const errors = [];
  const authorName = String(payload.authorName || "").trim();
  const message = String(payload.message || "").trim();

  if (authorName.length < 2 || authorName.length > 80) {
    errors.push("authorName must be between 2 and 80 characters.");
  }

  if (message.length < 2 || message.length > 1000) {
    errors.push("message must be between 2 and 1000 characters.");
  }

  return { errors, value: { authorName, message } };
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
  ALLOWED_CATEGORIES,
  store,
  nextNumericId,
  buildTicketCode,
  findTicketIndexByIdentifier,
  validateNewTicket,
  validateTicketPatch,
  validateComment,
  nowIso
};
