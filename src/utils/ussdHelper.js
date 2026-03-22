const POLICY_REGEX = /^[A-Za-z0-9_-]{4,30}$/;
const CLAIM_TYPE_MAP = {
  "1": "Medical",
  "2": "Motor",
  "3": "Life",
};

function toSteps(text = "") {
  if (!text || typeof text !== "string") {
    return [];
  }

  return text.split("*");
}

function con(message) {
  return `CON ${message}`;
}

function end(message) {
  return `END ${message}`;
}

function isValidPolicyNumber(policyNumber = "") {
  return POLICY_REGEX.test(policyNumber.trim());
}

function isValidDate(dateInput = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return false;
  }

  const [year, month, day] = dateInput.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function normalizeDescription(description = "") {
  return description.trim().replace(/\s+/g, " ").slice(0, 160);
}

function getClaimType(selection) {
  return CLAIM_TYPE_MAP[selection] || null;
}

module.exports = {
  CLAIM_TYPE_MAP,
  con,
  end,
  getClaimType,
  isValidDate,
  isValidPolicyNumber,
  normalizeDescription,
  toSteps,
};
