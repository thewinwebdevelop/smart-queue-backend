import * as dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
dotenv.config(); 

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Firebase environment variables are not set correctly!");
}
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: privateKey,
};

initializeApp({
  credential: cert(serviceAccount as any),
});

export const db = getFirestore();
