import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const { data, error } = await insforgeAdmin.database.from('users').update({role: 'admin'}).eq('email', 'kag@gmail.com');
  console.log("Updated kag@gmail.com to admin:", error ? error : "Success");
}
main();
