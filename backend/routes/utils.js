
const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_STATUSES = ["Open", "In Progress", "Closed"];
const ALLOWED_CATEGORIES = ["Bug", "Request", "Support"];

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesEnum(value, allowedValues) {
  const normalizedInput = normalizeLabel(value);
  return allowedValues.find((item) => normalizeLabel(item) === normalizedInput) || null;
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
      requesterId: Number(payload.requesterId) || null
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

  if (Object.keys(value).length === 0 && errors.length === 0) {
    errors.push("At least one updatable field is required.");
  }

  return { errors, value };
}

function validateComment(payload) {
  const errors = [];
  const message = String(payload.message || "").trim();

  if (message.length < 2 || message.length > 1000) {
    errors.push("message must be between 2 and 1000 characters.");
  }

  return { errors, value: { message } };
}

module.exports = {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
  ALLOWED_CATEGORIES,
  validateNewTicket,
  validateTicketPatch,
  validateComment
};
