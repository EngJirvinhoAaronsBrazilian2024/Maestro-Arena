import { insforge } from './src/lib/insforge.js';
import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const email = 'admin@sportshub.com';
  const password = 'adminpassword123';
  
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name: 'Admin User'
  });
  
  if (error) {
    console.error("Error creating user:", error);
    return;
  }
  
  const userId = data.user.id;
  
  // Make sure they have a user record
  const { data: existingUser } = await insforgeAdmin.database.from('users').select('id').eq('id', userId).single();
  
  if (existingUser) {
    await insforgeAdmin.database.from('users').update({ role: 'admin' }).eq('id', userId);
  } else {
    await insforgeAdmin.database.from('users').insert([{
      id: userId,
      email: email,
      display_name: 'Admin User',
      role: 'admin',
      created_at: Date.now(),
      updated_at: Date.now()
    }]);
  }
  
  console.log("Admin user created.");
}
main();
