// 简化的Firebase测试
console.log('🔍 Firebase 项目配置检查\n');

console.log('📋 当前配置:');
console.log('   Project ID: guidin-db601');
console.log('   Auth Domain: guidin-db601.firebaseapp.com');
console.log('   Storage Bucket: guidin-db601.appspot.com');
console.log('');

console.log('🚨 检测到错误: storage/retry-limit-exceeded');
console.log('');

console.log('💡 这个错误通常表示:');
console.log('   1. Firebase Storage 未启用');
console.log('   2. 网络连接问题');
console.log('   3. 项目配置错误');
console.log('');

console.log('🔧 解决步骤:');
console.log('');
console.log('步骤1: 启用 Firebase Storage');
console.log('   访问: https://console.firebase.google.com/project/guidin-db601/storage');
console.log('   如果看到"开始使用"按钮，点击它');
console.log('   选择存储位置: us-central1 (推荐)');
console.log('   点击"完成"');
console.log('');

console.log('步骤2: 配置安全规则');
console.log('   在Storage页面点击"规则"标签');
console.log('   复制以下规则:');
console.log('');
console.log('   rules_version = \'2\';');
console.log('   service firebase.storage {');
console.log('     match /b/{bucket}/o {');
console.log('       match /{allPaths=**} {');
console.log('         allow read: if true;');
console.log('         allow write: if request.auth != null;');
console.log('       }');
console.log('     }');
console.log('   }');
console.log('');
console.log('   点击"发布"按钮');
console.log('');

console.log('步骤3: 测试上传');
console.log('   完成上述配置后:');
console.log('   1. 访问: http://localhost:3000/quick-upload');
console.log('   2. 登录你的账户');
console.log('   3. 选择一张小图片 (< 1MB)');
console.log('   4. 点击"⚡ 终极上传"');
console.log('');

console.log('🎯 如果问题仍然存在:');
console.log('   1. 检查网络连接');
console.log('   2. 尝试使用不同的网络');
console.log('   3. 确认Firebase项目ID正确');
console.log('   4. 重新创建Firebase项目');
console.log('');

console.log('📞 需要进一步帮助时，请提供:');
console.log('   1. Firebase Console Storage页面的截图');
console.log('   2. 浏览器控制台的完整错误信息');
console.log('   3. 网络连接状态'); 