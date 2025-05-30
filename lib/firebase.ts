// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 🔥 FIREBASE 配置说明
// 如果您看到 "API key not valid" 错误，请：
// 1. 访问 https://console.firebase.google.com/
// 2. 选择或创建项目 "guidin-db601"
// 3. 项目设置 > 常规 > 您的应用 > Web应用 > 配置
// 4. 复制正确的配置值替换下面的默认值
// 5. 或创建 .env.local 文件设置环境变量

const firebaseConfig = {
  // ✅ 用户提供的正确Firebase配置
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "guidin-db601.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "guidin-db601",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "guidin-db601.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "831633555817",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:831633555817:web:cf598c871c41f83a4dfdf8",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EHKPF1364Q"
};

// 验证配置
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key_here") {
  console.error("🚨 Firebase配置无效！请设置正确的API密钥。");
  console.log("📝 获取配置步骤：");
  console.log("1. 访问：https://console.firebase.google.com/");
  console.log("2. 选择项目：guidin-db601（或创建新项目）");
  console.log("3. 项目设置 > 常规 > 您的应用");
  console.log("4. 复制Web应用的配置");
} else {
  console.log("✅ Firebase配置已加载");
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
  // 检查是否支持Analytics并且没有被CSP阻止
  isSupported().then(supported => {
    if (supported && firebaseConfig.apiKey !== "your_api_key_here" && firebaseConfig.apiKey) {
      try {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
        // Analytics初始化失败不应该影响其他功能
      }
    } else {
      console.log('Firebase Analytics is not supported or configuration invalid');
    }
  }).catch(error => {
    console.warn('Error checking Analytics support:', error);
  });
}

export { analytics }; 