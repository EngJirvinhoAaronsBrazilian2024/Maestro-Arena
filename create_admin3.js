import { createClient, createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const anonKey = process.env.VITE_INSFORGE_ANON_KEY;
const insforge = createClient({ baseUrl: url, apiKey: anonKey });
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
    if (error.message.includes('already exists')) {
      const { data: existingData } = await insforge.auth.signInWithPassword({ email, password });
      if (existingData?.user) {
        await insforgeAdmin.database.from('users').update({ role: 'admin' }).eq('id', existingData.user.id);
        console.log("Existing user promoted to admin.");
        return;
      }
    }
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
