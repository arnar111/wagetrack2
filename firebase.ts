// Fix: Use single quotes for consistency and ensure v9 modular imports are correctly resolved.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// HARDCODED CREDENTIALS: Fixes 'invalid-api-key' or missing env variable issues
const firebaseConfig = {
  apiKey: "AIzaSyBlDlTWdxsGzoK0NRnNAnQ063E_MF-JXs8",
  authDomain: "launatakk.firebaseapp.com",
  projectId: "launatakk",
  storageBucket: "launatakk.firebasestorage.app",
  messagingSenderId: "220116110036",
  appId: "1:220116110036:web:f26a15d66857be9f968941"
};

console.log("🔥 Firebase Init: Stable Mode");

// Initialize Firebase app using modular SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { signInAnonymously };

export default app;