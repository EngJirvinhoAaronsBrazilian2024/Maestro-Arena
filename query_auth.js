import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;
const insforgeAdmin = createAdminClient({ baseUrl: url, apiKey });

async function main() {
  const { data, error } = await insforgeAdmin.database.schema('auth').from('users').select('id, email').eq('email', 'kisakyearon72@gmail.com');
  console.log("Result:", data, error);
}
main();
