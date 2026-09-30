import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
}

export const OFFICIAL_FIREBASE_CONFIG: FirebaseConfigParams = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDmzOxuFpTAhPFAb8OkiGIkE6jl-Fm5XME',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'newfarmerboxs.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'newfarmerboxs',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'newfarmerboxs.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '757397760439',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:757397760439:web:8e464e4a0465860693a032',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || ''
};

// Read from import.meta.env (defined in .env) or localStorage
const getSavedConfig = (): FirebaseConfigParams => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('farmerbox_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey && (parsed.projectId === 'newfarmerboxs' || parsed.projectId)) {
          return parsed;
        } else {
          localStorage.removeItem('farmerbox_firebase_config');
        }
      }
    } catch (e) {
      console.warn('Error reading stored Firebase config', e);
    }
  }

  return OFFICIAL_FIREBASE_CONFIG;
};

export const currentFirebaseConfig = getSavedConfig();

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    currentFirebaseConfig.apiKey &&
    currentFirebaseConfig.projectId &&
    currentFirebaseConfig.appId
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(currentFirebaseConfig) : getApps()[0];
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      });
    } catch {
      db = getFirestore(app);
    }
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
  }
}

export { app, db, storage, auth };

export const saveCustomFirebaseConfig = (config: FirebaseConfigParams): boolean => {
  try {
    localStorage.setItem('farmerbox_firebase_config', JSON.stringify(config));
    window.location.reload();
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    return false;
  }
};
