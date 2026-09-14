import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const key = process.env.VITE_INSFORGE_ANON_KEY;
const insforge = createClient(url, key);

async function main() {
  const email = 'kisakyearon72@gmail.com';
  
  // Try to sign in just to prove they exist or insert manually
  const { data: { session }, error: signInError } = await insforge.auth.signInWithPassword({
    email: email,
    password: 'password123' // Fake just to check
  });
  console.log("Checking if user exists...");
}
main();
