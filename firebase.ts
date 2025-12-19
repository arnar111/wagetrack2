import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, OAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlDlTWdxsGzoK0NRnNAnQ063E_MF-JXs8",
  authDomain: "launatakk.firebaseapp.com",
  projectId: "launatakk",
  storageBucket: "launatakk.firebasestorage.app",
  messagingSenderId: "220116110036",
  appId: "1:220116110036:web:f26a15d66857be9f968941"
};

console.log("🔥 Firebase Init: Microsoft Enabled");

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Microsoft Provider
export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  // Forces the select account screen every time
  prompt: 'select_account' 
});

export { signInAnonymously, signInWithPopup };
export default app;
