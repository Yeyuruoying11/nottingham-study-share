// Firebase Storage 配置检查脚本
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

async function checkStorageConfiguration() {
  console.log('🔍 开始检查 Firebase Storage 配置...\n');

  try {
    // 1. 初始化 Firebase
    console.log('1. 初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    console.log('✅ Firebase 初始化成功');
    console.log(`   Storage Bucket: ${storage.app.options.storageBucket}\n`);

    // 2. 测试创建引用
    console.log('2. 测试创建 Storage 引用...');
    const testRef = ref(storage, 'test/connection-test.txt');
    console.log('✅ Storage 引用创建成功\n');

    // 3. 测试上传小文件
    console.log('3. 测试上传小文件...');
    const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const uploadResult = await uploadBytes(testRef, testData);
    console.log('✅ 文件上传成功');
    console.log(`   文件路径: ${uploadResult.ref.fullPath}\n`);

    // 4. 测试获取下载URL
    console.log('4. 测试获取下载URL...');
    const downloadURL = await getDownloadURL(testRef);
    console.log('✅ 下载URL获取成功');
    console.log(`   URL: ${downloadURL}\n`);

    // 5. 清理测试文件
    console.log('5. 清理测试文件...');
    await deleteObject(testRef);
    console.log('✅ 测试文件删除成功\n');

    console.log('🎉 所有测试通过！Firebase Storage 配置正确。');
    
    return {
      success: true,
      message: 'Firebase Storage 配置正确，可以正常使用'
    };

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    // 分析错误类型
    let suggestion = '';
    if (error.code === 'storage/unauthorized') {
      suggestion = `
🔧 解决方案：
1. 检查 Firebase Storage 安全规则
2. 确保规则允许读写操作
3. 推荐规则：
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }`;
    } else if (error.code === 'storage/retry-limit-exceeded') {
      suggestion = `
🔧 解决方案：
1. 检查网络连接
2. 确保 Firebase Storage 已启用
3. 检查 Storage Bucket 名称是否正确`;
    } else if (error.message.includes('fetch')) {
      suggestion = `
🔧 解决方案：
1. 检查网络连接
2. 确保可以访问 Firebase 服务
3. 检查防火墙设置`;
    }

    console.log(suggestion);
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      suggestion
    };
  }
}

// 运行检查
checkStorageConfiguration()
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 