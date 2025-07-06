import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAuZuJh1WE56n619wbCjD0PvoqWVbqTTDE",
  authDomain: "resolve25-9e336.firebaseapp.com",
  projectId: "resolve25-9e336",
  storageBucket: "resolve25-9e336.appspot.com",
  messagingSenderId: "726995356209",
  appId: "1:726995356209:web:6cee314eac73b10b3ea310",
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
