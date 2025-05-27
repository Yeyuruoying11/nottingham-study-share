// 诊断 Firebase Storage Bucket 配置问题
const https = require('https');

console.log('🔍 诊断 Firebase Storage Bucket 配置问题...\n');

// 测试两个可能的 bucket
const buckets = [
  'guidin-db601.firebasestorage.app',
  'guidin-db601.appspot.com'
];

const testBucket = (bucket) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'firebasestorage.googleapis.com',
      port: 443,
      path: `/v0/b/${bucket}/o`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📋 测试 Bucket: ${bucket}`);
      console.log(`   状态码: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log(`   ✅ Bucket 存在且可访问`);
        resolve({ bucket, exists: true, status: res.statusCode });
      } else if (res.statusCode === 404) {
        console.log(`   ❌ Bucket 不存在`);
        resolve({ bucket, exists: false, status: res.statusCode });
      } else {
        console.log(`   ⚠️  其他状态: ${res.statusCode}`);
        resolve({ bucket, exists: 'unknown', status: res.statusCode });
      }
      console.log('');
    });

    req.on('error', (error) => {
      console.log(`   ❌ 请求失败: ${error.message}\n`);
      resolve({ bucket, exists: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`   ❌ 请求超时\n`);
      req.destroy();
      resolve({ bucket, exists: false, error: '超时' });
    });

    req.end();
  });
};

// 测试 CORS 配置
const testCORS = (bucket, origin) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'firebasestorage.googleapis.com',
      port: 443,
      path: `/v0/b/${bucket}/o`,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    };

    const req = https.request(options, (res) => {
      const corsOrigin = res.headers['access-control-allow-origin'];
      const corsAllowed = corsOrigin === '*' || corsOrigin === origin;
      
      console.log(`   CORS 测试 (${origin}):`);
      console.log(`     Allow-Origin: ${corsOrigin || '未设置'}`);
      console.log(`     状态: ${corsAllowed ? '✅ 允许' : '❌ 拒绝'}`);
      
      resolve({ bucket, origin, allowed: corsAllowed, corsOrigin });
    });

    req.on('error', () => {
      resolve({ bucket, origin, allowed: false, error: true });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ bucket, origin, allowed: false, timeout: true });
    });

    req.end();
  });
};

// 运行诊断
const runDiagnosis = async () => {
  console.log('🚀 开始诊断...\n');
  
  // 1. 测试 bucket 存在性
  console.log('=== 第一步：测试 Bucket 存在性 ===');
  const bucketResults = [];
  for (const bucket of buckets) {
    const result = await testBucket(bucket);
    bucketResults.push(result);
  }
  
  // 2. 测试 CORS 配置
  console.log('=== 第二步：测试 CORS 配置 ===');
  const vercelOrigin = 'https://nottingham-study-share-llhka0qae-yeyuruoyings-projects-263dab2e.vercel.app';
  
  for (const result of bucketResults) {
    if (result.exists === true) {
      console.log(`\n🔍 测试 ${result.bucket} 的 CORS 配置:`);
      await testCORS(result.bucket, vercelOrigin);
    }
  }
  
  // 3. 生成诊断报告
  console.log('\n=== 诊断报告 ===');
  const existingBuckets = bucketResults.filter(r => r.exists === true);
  
  if (existingBuckets.length === 0) {
    console.log('❌ 没有找到可用的 Storage Bucket');
    console.log('🔧 建议：检查 Firebase 项目配置');
  } else if (existingBuckets.length === 1) {
    const bucket = existingBuckets[0].bucket;
    console.log(`✅ 找到唯一可用的 Bucket: ${bucket}`);
    console.log(`🔧 建议：确保代码和 Vercel 环境变量都使用 ${bucket}`);
  } else {
    console.log('⚠️  找到多个可用的 Bucket:');
    existingBuckets.forEach(r => console.log(`   - ${r.bucket}`));
    console.log('🔧 建议：统一使用其中一个 Bucket');
  }
  
  console.log('\n📝 下一步操作：');
  console.log('1. 在 Vercel Dashboard 中设置正确的环境变量');
  console.log('2. 确保 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 使用正确的值');
  console.log('3. 重新部署 Vercel 项目');
  console.log('4. 为正确的 bucket 配置 CORS');
};

runDiagnosis(); 