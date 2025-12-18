
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlDlTWdxsGzoK0NRnNAnQ063E_MF-JXs8",
  authDomain: "launatakk.firebaseapp.com",
  projectId: "launatakk",
  storageBucket: "launatakk.firebasestorage.app",
  messagingSenderId: "220116110036",
  appId: "1:220116110036:web:f26a15d66857be9f968941"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
