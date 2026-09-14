import { getInsforgeAdmin } from './src/server/insforgeAdmin.js';
const admin = getInsforgeAdmin();
async function run() {
  const { data, error } = await admin.database.from('quiz_stats').select('*').limit(5);
  console.log("Stats:", data, error);
}
run();
