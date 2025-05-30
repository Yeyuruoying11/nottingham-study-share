// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 🔥 FIREBASE 配置说明
// 请在Vercel Dashboard或.env.local中设置以下环境变量：
// NEXT_PUBLIC_FIREBASE_API_KEY
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
// NEXT_PUBLIC_FIREBASE_PROJECT_ID
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
// NEXT_PUBLIC_FIREBASE_APP_ID
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 验证必需的配置项
const requiredConfig = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': firebaseConfig.apiKey,
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': firebaseConfig.authDomain,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': firebaseConfig.projectId,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': firebaseConfig.storageBucket,
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': firebaseConfig.messagingSenderId,
  'NEXT_PUBLIC_FIREBASE_APP_ID': firebaseConfig.appId
};

const missingVars = Object.entries(requiredConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("🚨 Firebase配置错误：缺少以下环境变量：");
  missingVars.forEach(varName => {
    console.error(`  ❌ ${varName}`);
  });
  console.log("📝 请在Vercel Dashboard的Environment Variables中设置这些变量");
  console.log("或者在本地开发时在.env.local文件中设置");
  
  throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
} else {
  console.log("✅ Firebase配置已从环境变量加载");
}

// Initialize Firebase
let app;
try {
  // 检查是否已经初始化
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Storage bucket:", firebaseConfig.storageBucket);
} catch (error) {
  console.error("Firebase初始化失败:", error);
  throw error;
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
  // 检查是否支持Analytics
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
        // Analytics初始化失败不应该影响其他功能
      }
    } else {
      console.log('Firebase Analytics is not supported or measurementId not provided');
    }
  }).catch(error => {
    console.warn('Error checking Analytics support:', error);
  });
}

export { analytics }; 