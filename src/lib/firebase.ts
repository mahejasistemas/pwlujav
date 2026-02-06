import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate Config
if (!firebaseConfig.apiKey) {
  if (typeof window !== "undefined") {
    console.error("Firebase API Key is missing. Check .env.local");
  }
}

// Initialize Firebase
const app = !getApps().length && firebaseConfig.apiKey ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : undefined);

// Export services safely
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let analytics: Analytics | undefined;

if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported && process.env.NODE_ENV === 'production') {
        analytics = getAnalytics(app);
      }
    });
  }
} else {
    console.warn("Firebase not initialized due to missing config.");
}

export { auth, db, googleProvider, analytics };
