import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const email = 'kisakyearon72@gmail.com';
  console.log("Attempting to elevate user:", email);
  
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();
    
  if (error) {
    console.error("Error promoting user:", error);
  } else if (data && data.length > 0) {
    console.log("Success! Promoted to admin:", data[0].email, data[0].role);
  } else {
    console.log("User not found in public.users yet. Have they signed up?");
  }
}
main();
