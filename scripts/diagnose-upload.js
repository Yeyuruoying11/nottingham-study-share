// 诊断上传问题的脚本
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } = require('firebase/storage');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBJJXPq0x0hT-6B-GwpVu5YmwPFKNjkJz0",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "843377802440",
  appId: "1:843377802440:web:c3778b2a4a01e08f1c416f"
};

async function diagnoseUpload() {
  console.log('🔍 开始诊断Firebase Storage上传问题...\n');

  try {
    // 1. 初始化Firebase
    console.log('1️⃣ 初始化Firebase...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    console.log('✅ Firebase初始化成功');
    console.log('📦 Storage bucket:', storage.app.options.storageBucket);

    // 2. 测试存储引用创建
    console.log('\n2️⃣ 测试存储引用创建...');
    const testRef = ref(storage, 'test/diagnose-test.txt');
    console.log('✅ 存储引用创建成功');
    console.log('📝 引用路径:', testRef.fullPath);

    // 3. 创建测试文件
    console.log('\n3️⃣ 创建测试文件...');
    const testContent = `诊断测试 - ${new Date().toISOString()}`;
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    console.log('✅ 测试文件创建成功');
    console.log('📄 文件大小:', testBlob.size, 'bytes');

    // 4. 尝试上传
    console.log('\n4️⃣ 尝试上传测试文件...');
    const snapshot = await uploadBytes(testRef, testBlob);
    console.log('✅ 文件上传成功!');
    console.log('📊 上传详情:', {
      bytesTransferred: snapshot.totalBytes,
      contentType: snapshot.metadata.contentType,
      bucket: snapshot.metadata.bucket,
      name: snapshot.metadata.name
    });

    // 5. 获取下载链接
    console.log('\n5️⃣ 获取下载链接...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ 获取下载链接成功!');
    console.log('🔗 下载链接:', downloadURL);

    // 6. 测试图片文件上传
    console.log('\n6️⃣ 测试图片文件上传...');
    
    // 创建一个1x1像素的透明PNG图片
    const canvas = document.createElement ? document.createElement('canvas') : null;
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 1, 1);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const imageRef = ref(storage, 'test/diagnose-image.png');
          const imageSnapshot = await uploadBytes(imageRef, blob);
          const imageURL = await getDownloadURL(imageSnapshot.ref);
          console.log('✅ 图片上传成功!');
          console.log('🖼️ 图片链接:', imageURL);
        }
      }, 'image/png');
    } else {
      console.log('⚠️ 无法在Node.js环境中创建Canvas，跳过图片测试');
    }

    console.log('\n🎉 所有测试通过！Storage配置正常。');
    
  } catch (error) {
    console.error('\n❌ 诊断过程中出现错误:');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          console.log('\n💡 解决方案:');
          console.log('- 检查Firebase Storage安全规则');
          console.log('- 确保用户已登录且有上传权限');
          console.log('- 检查项目是否启用了Storage服务');
          break;
        case 'storage/quota-exceeded':
          console.log('\n💡 解决方案:');
          console.log('- Storage配额已满，需要升级到Blaze计划');
          console.log('- 或者删除一些旧文件释放空间');
          break;
        case 'storage/invalid-argument':
          console.log('\n💡 解决方案:');
          console.log('- 检查文件路径是否有效');
          console.log('- 检查文件类型是否支持');
          break;
        case 'storage/canceled':
          console.log('\n💡 解决方案:');
          console.log('- 上传被取消，可能是网络问题');
          break;
        default:
          console.log('\n💡 建议:');
          console.log('- 检查网络连接');
          console.log('- 确认Firebase项目配置正确');
          console.log('- 查看Firebase控制台的错误日志');
      }
    }
    
    console.log('\n🔧 调试信息:');
    console.log('- Project ID:', firebaseConfig.projectId);
    console.log('- Storage Bucket:', firebaseConfig.storageBucket);
    console.log('- API Key:', firebaseConfig.apiKey.substring(0, 20) + '...');
  }
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 创建DOM元素
  const testDiv = document.createElement('div');
  testDiv.innerHTML = '<canvas width="1" height="1"></canvas>';
  document.body.appendChild(testDiv);
  
  // 运行诊断
  diagnoseUpload();
} else {
  console.log('请在浏览器环境中运行此诊断脚本');
  console.log('或者将此脚本添加到网页中执行');
}

module.exports = { diagnoseUpload }; 