import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config();

let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getInsforgeAdmin() {
  if (!adminClient) {
    const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
    const defaultApiKey = 'ik_1511e30588f62085892b4a0a3db0d10c';
    const apiKey = process.env.INSFORGE_API_KEY || defaultApiKey;
    
    adminClient = createAdminClient({
      baseUrl: url,
      apiKey: apiKey,
    });
  }
  return adminClient;
}
