import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import fallbackConfig from '../firebase-applet-config.json';

// Firebase config: prefer environment variables, fall back to config file.
// To migrate: set VITE_FIREBASE_* env vars and remove firebase-applet-config.json from repo.
const useEnv = !!import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = useEnv
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    }
  : {
      apiKey: fallbackConfig.apiKey,
      authDomain: fallbackConfig.authDomain,
      projectId: fallbackConfig.projectId,
      storageBucket: fallbackConfig.storageBucket,
      messagingSenderId: fallbackConfig.messagingSenderId,
      appId: fallbackConfig.appId,
      measurementId: fallbackConfig.measurementId,
    };

const firestoreDatabaseId = useEnv
  ? import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || ''
  : fallbackConfig.firestoreDatabaseId;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const storage = getStorage(app);
