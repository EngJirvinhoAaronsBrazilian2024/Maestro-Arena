import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const email = 'kisakyearon72@gmail.com';
  
  // Find user by email
  const { data: users, error: listError } = await insforgeAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
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
