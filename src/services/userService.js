const supabase = require("../config/supabaseClient");

async function findUserByPhoneNumber(phoneNumber) {
  const { data, error } = await supabase
    .from("users")
    .select("id, phone_number")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data;
}

async function createUser(phoneNumber) {
  const { data, error } = await supabase
    .from("users")
    .insert({ phone_number: phoneNumber })
    .select("id, phone_number")
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

async function findOrCreateUserByPhoneNumber(phoneNumber) {
  const existingUser = await findUserByPhoneNumber(phoneNumber);
  if (existingUser) {
    return existingUser;
  }

  return createUser(phoneNumber);
}

module.exports = {
  findOrCreateUserByPhoneNumber,
};
