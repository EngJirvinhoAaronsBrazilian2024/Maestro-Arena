import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getInsforgeAdmin() {
  if (!adminClient) {
    const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
    const apiKey = process.env.INSFORGE_API_KEY || '';
    if (!apiKey) {
      console.warn("Notice: INSFORGE_API_KEY is not set in environment variables. Admin operations requiring elevated permissions will be limited.");
    }
    
    adminClient = createAdminClient({
      baseUrl: url,
      apiKey: apiKey,
    });

  }
  return adminClient;
}
