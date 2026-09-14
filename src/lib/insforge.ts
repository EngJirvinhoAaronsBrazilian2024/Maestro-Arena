import { createClient } from '@insforge/sdk';

// Use standard import.meta.env for Vite
const rawUrl = import.meta.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app';
const insforgeUrl = rawUrl.replace(/\/$/, '');
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || 'dummy-anon-key';

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});
