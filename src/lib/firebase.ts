import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyALUFXWH9rJlAuIfDqO6MrrsmIBU_9Yskg",
  authDomain: "resolve25.firebaseapp.com",
  projectId: "resolve25",
  storageBucket: "resolve25.appspot.com",
  messagingSenderId: "952241091470",
  appId: "1:952241091470:web:3958e7a92db164ddd5aadf"
};

// Check if all required Firebase config values are present and not placeholders
const isFirebaseConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain !== 'YOUR_AUTH_DOMAIN';

const app = isFirebaseConfigValid && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
