// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDg_d0j3P58sPu-Bg6L0vx7kk7_O2CUsHM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "guidin-db601.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "guidin-db601",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "guidin-db601.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1026468227635",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1026468227635:web:8701872bb5c1e0fb40d1f9",
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
  // 如果已经初始化过，使用现有的实例
  const { getApps, getApp } = await import('firebase/app');
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 获取storage bucket信息
console.log('Storage bucket:', storage.app.options.storageBucket);

// 只在客户端初始化Analytics
let analytics = null;

if (typeof window !== 'undefined') {
  // 检查是否支持Analytics并且没有被CSP阻止
  isSupported().then(supported => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
        // Analytics初始化失败不应该影响其他功能
      }
    } else {
      console.log('Firebase Analytics is not supported in this environment');
    }
  }).catch(error => {
    console.warn('Error checking Analytics support:', error);
  });
}

export { analytics }; 