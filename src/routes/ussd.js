const express = require("express");
const {
  con,
  end,
  getClaimType,
  isValidDate,
  isValidPolicyNumber,
  normalizeDescription,
  toSteps,
} = require("../utils/ussdHelper");
const { findOrCreateUserByPhoneNumber } = require("../services/userService");
const {
  createClaim,
  getClaimStatusByReference,
  getPolicyInfo,
} = require("../services/claimService");

const router = express.Router();

function mainMenu() {
  return con("Welcome to Insurance Claims\n1. File a Claim\n2. Check Claim Status\n3. Policy Info");
}

function selectClaimTypeMenu() {
  return con("Select claim type\n1. Medical\n2. Motor\n3. Life");
}

function parseFileClaimInputs(steps) {
  const claimType = getClaimType(steps[1]);
  if (!claimType) {
    return { prompt: con("Invalid option.\nSelect claim type\n1. Medical\n2. Motor\n3. Life") };
  }

  if (steps.length === 2) {
    return { prompt: con("Enter Policy Number") };
  }

  let policyIndex = 2;
  let policyNumber = (steps[policyIndex] || "").trim();

  if (!isValidPolicyNumber(policyNumber)) {
    if (steps.length > 3 && isValidPolicyNumber((steps[3] || "").trim())) {
      policyIndex = 3;
      policyNumber = (steps[policyIndex] || "").trim();
    } else {
      return {
        prompt: con("Invalid policy number.\nEnter Policy Number (e.g. POL12345)"),
      };
    }
  }

  const dateCandidateStart = policyIndex + 1;
  const dateToken = (steps[dateCandidateStart] || "").trim();

  if (!dateToken) {
    return { prompt: con("Enter Incident Date (YYYY-MM-DD)") };
  }

  let dateIndex = dateCandidateStart;
  let incidentDate = dateToken;

  if (!isValidDate(incidentDate)) {
    const retryDate = (steps[dateCandidateStart + 1] || "").trim();
    if (retryDate && isValidDate(retryDate)) {
      dateIndex = dateCandidateStart + 1;
      incidentDate = retryDate;
    } else {
      return { prompt: con("Invalid date.\nEnter Incident Date (YYYY-MM-DD)") };
    }
  }

  const descriptionToken = (steps[dateIndex + 1] || "").trim();
  if (!descriptionToken) {
    return { prompt: con("Enter short description") };
  }

  const description = normalizeDescription(descriptionToken);
  if (!description) {
    return { prompt: con("Description cannot be empty.\nEnter short description") };
  }

  return {
    claimType,
    policyNumber,
    incidentDate,
    description,
  };
}

async function handleFileClaim(steps, phoneNumber) {
  if (steps.length === 1) {
    return selectClaimTypeMenu();
  }

  const parsed = parseFileClaimInputs(steps);
  if (parsed.prompt) {
    return parsed.prompt;
  }

  const user = await findOrCreateUserByPhoneNumber(phoneNumber);
  const claim = await createClaim({
    userId: user.id,
    policyNumber: parsed.policyNumber,
    claimType: parsed.claimType,
    incidentDate: parsed.incidentDate,
    description: parsed.description,
    phoneNumber,
  });

  return end(`Claim submitted successfully.\nReference: ${claim.reference}`);
}

async function handleCheckStatus(steps) {
  if (steps.length === 1) {
    return con("Enter claim reference");
  }

  const reference = (steps[1] || "").trim().toUpperCase();
  if (!reference) {
    return con("Invalid reference.\nEnter claim reference");
  }

  const claim = await getClaimStatusByReference(reference);
  if (!claim) {
    return end("Claim not found.");
  }

  return end(`Reference: ${claim.reference}\nStatus: ${claim.status}`);
}

async function handlePolicyInfo(steps) {
  if (steps.length === 1) {
    return con("Enter Policy Number");
  }

  const policyNumber = (steps[1] || "").trim();
  if (!isValidPolicyNumber(policyNumber)) {
    return con("Invalid policy number.\nEnter Policy Number");
  }

  const policy = await getPolicyInfo(policyNumber);
  if (!policy) {
    return end("Policy not found. Contact support.");
  }

  return end(`Policy: ${policy.policy_number}\nType: ${policy.type}`);
}

router.post("/", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber } = req.body;
  const text = typeof req.body.text === "string" ? req.body.text : "";

  if (!sessionId || !serviceCode || !phoneNumber) {
    return res.status(400).send(end("Invalid request payload."));
  }

  const steps = toSteps(text);
  const selectedMenu = steps[0];

  try {
    if (!selectedMenu) {
      return res.send(mainMenu());
    }

    if (selectedMenu === "1") {
      return res.send(await handleFileClaim(steps, phoneNumber));
    }

    if (selectedMenu === "2") {
      return res.send(await handleCheckStatus(steps));
    }

    if (selectedMenu === "3") {
      return res.send(await handlePolicyInfo(steps));
    }

    return res.send(end("Invalid selection."));
  } catch (error) {
    console.error("USSD processing error:", error);
    return res.send(end("An error occurred. Please try again."));
  }
});

module.exports = router;
