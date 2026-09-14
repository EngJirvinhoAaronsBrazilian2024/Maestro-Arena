import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

let app: any;
let firestoreDatabaseId: string | undefined = undefined;

try {
  // Try to load the config to get the project ID and database ID
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const configStr = readFileSync(configPath, 'utf8');
  const config = JSON.parse(configStr);

  app = admin.initializeApp({
    projectId: config.projectId,
  });
  firestoreDatabaseId = config.firestoreDatabaseId;
} catch (error) {
  console.warn("Could not load firebase-applet-config.json for admin init, falling back to default:", error);
  app = admin.initializeApp();
}

export const adminDb = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
