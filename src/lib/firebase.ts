import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Check if all required Firebase config values are present and not placeholders
const isFirebaseConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain !== 'YOUR_AUTH_DOMAIN';

const app = isFirebaseConfigValid && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
export const auth = app ? getAuth(app) : null;
