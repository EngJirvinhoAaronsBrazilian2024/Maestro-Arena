import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const email = 'kisakyearon72@gmail.com';
  
  // Find user by email in the public.users table
  const { data: users, error: listError } = await insforgeAdmin.database.from('users').select('id, email').eq('email', email);
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  const user = users[0];
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  // Update user to confirmed
  const { data, error } = await insforgeAdmin.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );
  
  if (error) {
    console.error("Error confirming user:", error);
  } else {
    console.log("Successfully confirmed user:", data.user.email);
  }
}
main();
