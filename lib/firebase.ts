// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "guidin-db601.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "guidin-db601",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "guidin-db601.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "831633555817",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:831633555817:web:cf598c871c41f83a4dfdf8",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EHKPF1364Q"
};

// 验证配置
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("Firebase configuration is incomplete:", firebaseConfig);
  throw new Error("Firebase configuration is incomplete");
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  console.log("Storage bucket:", firebaseConfig.storageBucket);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  throw error;
}

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; 