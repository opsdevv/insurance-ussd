const supabase = require("../config/supabaseClient");

function generateClaimReference(phoneNumber = "") {
  const phoneTail = String(phoneNumber).replace(/\D/g, "").slice(-4) || "0000";
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CLM${Date.now()}${phoneTail}${randomSuffix}`;
}

async function createClaim({
  userId,
  policyNumber,
  claimType,
  incidentDate,
  description,
  phoneNumber,
}) {
  let reference = generateClaimReference(phoneNumber);
  let attempts = 0;

  // Retry reference generation on the rare chance of collision.
  while (attempts < 3) {
    const { data, error } = await supabase
      .from("claims")
      .insert({
        user_id: userId,
        policy_number: policyNumber,
        claim_type: claimType,
        incident_date: incidentDate,
        description,
        reference,
      })
      .select("id, reference, status")
      .single();

    if (!error) {
      return data;
    }

    const isUniqueViolation = String(error.code) === "23505";
    if (!isUniqueViolation) {
      throw new Error(`Failed to create claim: ${error.message}`);
    }

    attempts += 1;
    reference = generateClaimReference(phoneNumber);
  }

  throw new Error("Failed to generate unique claim reference.");
}

async function getClaimStatusByReference(reference) {
  const { data, error } = await supabase
    .from("claims")
    .select("reference, status")
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch claim status: ${error.message}`);
  }

  return data;
}

async function getPolicyInfo(policyNumber) {
  const { data, error } = await supabase
    .from("policies")
    .select("policy_number, type")
    .eq("policy_number", policyNumber)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch policy info: ${error.message}`);
  }

  return data;
}

module.exports = {
  createClaim,
  getClaimStatusByReference,
  getPolicyInfo,
};
