import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();
const insforgeAdmin = createAdminClient({ baseUrl: process.env.VITE_INSFORGE_URL, apiKey: process.env.INSFORGE_API_KEY });
async function main() {
  const { data: users, error } = await insforgeAdmin.auth.admin.listUsers();
  if (error) console.error(error);
  else console.log(users.users.map(u => u.email));
}
main();
