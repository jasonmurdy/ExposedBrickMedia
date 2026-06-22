import admin from 'firebase-admin';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@dummy.com', // Not needed for just reading firestore if GOOGLE_APPLICATION_CREDENTIALS works or running in local environment? Actually, without service account, we can just use the web SDK if we run it as a regular script... wait, we need admin to write without auth, or we can use web SDK.
    }),
  });
}
