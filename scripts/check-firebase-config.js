// Firebase配置检查脚本

// 检查环境变量
console.log('=== Firebase 环境变量检查 ===');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '已设置' : '未设置');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '已设置' : '未设置');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '已设置' : '未设置');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '已设置' : '未设置');

// 默认配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "guidin-db601.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "guidin-db601",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "guidin-db601.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "831633555817",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:831633555817:web:cf598c871c41f83a4dfdf8",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EHKPF1364Q"
};

console.log('\n=== Firebase 配置信息 ===');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('Auth Domain:', firebaseConfig.authDomain);

console.log('\n=== Firebase Storage 安全规则建议 ===');
console.log(`
请在 Firebase Console 中设置以下 Storage 安全规则：

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 允许已认证用户上传到自己的文件夹
    match /posts/{userId}/{allPaths=**} {
      allow read: if true; // 所有人都可以读取
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 临时规则：允许所有已认证用户上传（用于测试）
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

设置步骤：
1. 访问 https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/rules
2. 将上述规则复制粘贴到规则编辑器中
3. 点击"发布"按钮

注意：第二个规则是临时测试规则，生产环境中应该删除。
`);

console.log('\n=== 测试建议 ===');
console.log('1. 访问 http://localhost:3000/test-upload 进行上传测试');
console.log('2. 检查浏览器控制台的详细错误信息');
console.log('3. 确认用户已登录且有有效的 UID');
console.log('4. 检查网络连接和防火墙设置');

console.log('\n=== 常见问题排查 ===');
console.log('如果上传失败，请检查：');
console.log('• Firebase Storage 安全规则是否正确配置');
console.log('• 用户是否已登录（有有效的 auth token）');
console.log('• 网络连接是否正常');
console.log('• 文件大小是否超过限制（5MB）');
console.log('• 文件类型是否为图片格式');
console.log('• 浏览器控制台是否有具体错误信息'); 