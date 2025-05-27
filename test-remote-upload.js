// 测试远程上传功能
const https = require('https');

console.log('🔍 测试远程上传 CORS 配置...\n');

// 测试不同的 origin
const testOrigins = [
  'https://nottingham-study-share.vercel.app',
  'https://nottingham-study-share-git-main.vercel.app',
  'https://nottingham-study-share-llhka0qae-yeyuruoyings-projects-263dab2e.vercel.app'
];

const testCORS = (origin) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firebasestorage.googleapis.com',
      port: 443,
      path: '/v0/b/guidin-db601.firebasestorage.app/o',
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    };

    const req = https.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };

      console.log(`📋 测试 Origin: ${origin}`);
      console.log(`   状态码: ${res.statusCode}`);
      console.log(`   CORS Headers:`, corsHeaders);
      
      if (res.statusCode === 200 && corsHeaders['access-control-allow-origin']) {
        console.log(`   ✅ CORS 配置正确\n`);
        resolve(true);
      } else {
        console.log(`   ❌ CORS 配置有问题\n`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`   ❌ 请求失败: ${error.message}\n`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log(`   ❌ 请求超时\n`);
      req.destroy();
      reject(new Error('超时'));
    });

    req.end();
  });
};

// 运行测试
const runTests = async () => {
  console.log('🚀 开始测试 Firebase Storage CORS 配置...\n');
  
  let successCount = 0;
  
  for (const origin of testOrigins) {
    try {
      const success = await testCORS(origin);
      if (success) successCount++;
    } catch (error) {
      console.log(`测试 ${origin} 时出错:`, error.message);
    }
  }
  
  console.log(`📊 测试结果: ${successCount}/${testOrigins.length} 个域名通过 CORS 测试\n`);
  
  if (successCount === testOrigins.length) {
    console.log('🎉 所有测试通过！远程上传应该可以正常工作。');
    console.log('\n📝 下一步:');
    console.log('1. 确保 Vercel 部署已完成');
    console.log('2. 访问你的 Vercel 域名');
    console.log('3. 登录并测试图片上传功能');
  } else {
    console.log('⚠️  部分测试失败，可能需要等待 CORS 配置生效（最多10分钟）');
    console.log('\n🔧 故障排除:');
    console.log('1. 等待 5-10 分钟让 CORS 配置完全生效');
    console.log('2. 检查 Firebase Storage 安全规则');
    console.log('3. 确认 Vercel 域名是否正确');
  }
};

runTests(); 