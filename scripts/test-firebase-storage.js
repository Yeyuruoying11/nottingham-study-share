// Firebase Storage 测试脚本
const https = require('https');

console.log('🔍 测试 Firebase Storage 配置...\n');

// 测试 Firebase Storage API 访问
const testStorageAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firebasestorage.googleapis.com',
      port: 443,
      path: '/v0/b/guidin-db601.appspot.com/o',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Firebase Storage API 响应状态: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Firebase Storage 连接正常');
          try {
            const response = JSON.parse(data);
            if (response.items) {
              console.log(`📁 Storage 中已有 ${response.items.length} 个文件`);
            } else {
              console.log('📁 Storage 为空或无权限查看文件列表');
            }
          } catch (e) {
            console.log('📁 Storage 响应格式异常，但连接正常');
          }
        } else if (res.statusCode === 401) {
          console.log('⚠️  认证问题 - 可能需要配置安全规则');
        } else if (res.statusCode === 403) {
          console.log('⚠️  权限问题 - 需要检查 Firebase Storage 安全规则');
        } else {
          console.log(`⚠️  其他问题 - 状态码: ${res.statusCode}`);
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.log('❌ Firebase Storage 连接失败:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Firebase Storage 连接超时');
      req.destroy();
      reject(new Error('连接超时'));
    });

    req.end();
  });
};

// 检查项目配置
const checkProjectConfig = () => {
  console.log('📋 项目配置信息:');
  console.log('   Project ID: guidin-db601');
  console.log('   Storage Bucket: guidin-db601.appspot.com');
  console.log('   Region: 默认 (us-central1)');
  console.log('');
};

// 安全规则建议
const showSecurityRules = () => {
  console.log('🔒 推荐的 Firebase Storage 安全规则:');
  console.log('');
  console.log('rules_version = \'2\';');
  console.log('service firebase.storage {');
  console.log('  match /b/{bucket}/o {');
  console.log('    match /{allPaths=**} {');
  console.log('      allow read: if true;');
  console.log('      allow write: if request.auth != null;');
  console.log('    }');
  console.log('  }');
  console.log('}');
  console.log('');
  console.log('📝 配置步骤:');
  console.log('1. 访问: https://console.firebase.google.com/project/guidin-db601/storage/rules');
  console.log('2. 复制上述规则到编辑器');
  console.log('3. 点击"发布"按钮');
  console.log('');
};

// 运行测试
const runTest = async () => {
  try {
    checkProjectConfig();
    await testStorageAPI();
    console.log('');
    showSecurityRules();
    
    console.log('🎯 下一步测试建议:');
    console.log('1. 确保已配置上述安全规则');
    console.log('2. 访问 http://localhost:3000/quick-upload');
    console.log('3. 登录并尝试上传一张小图片');
    console.log('4. 如果失败，查看浏览器控制台错误信息');
    
  } catch (error) {
    console.log('');
    console.log('❌ 测试失败:', error.message);
    console.log('');
    console.log('🔧 可能的解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 确认 Firebase 项目 ID 正确');
    console.log('3. 检查 Firebase Storage 是否已启用');
  }
};

runTest(); 