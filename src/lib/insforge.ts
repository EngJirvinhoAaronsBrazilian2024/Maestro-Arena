import { createClient } from '@insforge/sdk';

// Use standard import.meta.env for Vite with process.env fallback for Node/SSR/tests
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_INSFORGE_URL) ||
  'https://gci83gu5.us-east.insforge.app';

const insforgeUrl = rawUrl.replace(/\/+$/, '');

const insforgeAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_INSFORGE_ANON_KEY) ||
  'dummy-anon-key';

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});
