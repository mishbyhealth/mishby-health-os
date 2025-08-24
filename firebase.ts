// firebase.ts (root)

// Firebase Core + Services
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
  inMemoryPersistence,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions
} from 'firebase/functions';

// ======================
// Firebase Configuration
// ======================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ======================
// Service Initialization
// ======================
const app: FirebaseApp = initializeApp(firebaseConfig);

// Authentication
const auth: Auth = getAuth(app);
auth.setPersistence(inMemoryPersistence); // Optional: Customize persistence

// Firestore Database
const db: Firestore = getFirestore(app);

// Cloud Storage
const storage: FirebaseStorage = getStorage(app);

// Cloud Functions
const functions: Functions = getFunctions(app);

// ======================
// Providers (Social Login)
// ======================
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ======================
// Emulator Configuration
// ======================
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST;

  connectAuthEmulator(
    auth,
    `http://${host}:${import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_PORT}`
  );

  connectFirestoreEmulator(
    db,
    host,
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT)
  );

  connectStorageEmulator(
    storage,
    host,
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_STORAGE_PORT || 9199)
  );

  connectFunctionsEmulator(
    functions,
    host,
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_FUNCTIONS_PORT || 5001)
  );
}

// ======================
// Exports
// ======================
export {
  app,
  auth,
  db,
  storage,
  functions,
  googleProvider,
  facebookProvider,
  type FirebaseApp,
  type Auth,
  type Firestore,
  type FirebaseStorage,
  type Functions
};
