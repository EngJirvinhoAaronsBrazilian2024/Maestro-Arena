import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getInsforgeAdmin() {
  if (!adminClient) {
    const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
    const apiKey = process.env.INSFORGE_API_KEY;

    if (!apiKey) {
      console.warn("INSFORGE_API_KEY is not set. Admin backend operations will fail.");
    }
    
    adminClient = createAdminClient({
      baseUrl: url,
      apiKey: apiKey || 'dummy-key',
    });
  }
  return adminClient;
}
