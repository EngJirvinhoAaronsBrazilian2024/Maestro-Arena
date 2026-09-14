import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const email = 'admin@sportshub.com';
  const password = 'adminpassword123';
  
  const { data, error } = await insforgeAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (error) {
    console.error("Error creating user:", error);
    return;
  }
  
  const userId = data.user.id;
  
  await insforgeAdmin.database.from('users').insert([{
    id: userId,
    email: email,
    display_name: 'Admin User',
    role: 'admin',
    created_at: Date.now(),
    updated_at: Date.now()
  }]);
  
  console.log("Admin user created.");
}
main();
