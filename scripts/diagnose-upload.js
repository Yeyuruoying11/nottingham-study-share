// 诊断上传问题的脚本
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "831633555817",
  appId: "1:831633555817:web:cf598c871c41f83a4dfdf8",
  measurementId: "G-EHKPF1364Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function diagnoseUpload() {
  console.log('🔍 开始诊断上传问题...\n');
  
  // 1. 检查环境信息
  console.log('📊 环境信息:');
  console.log('- Node.js 版本:', process.version);
  console.log('- 平台:', process.platform);
  console.log('- 架构:', process.arch);
  console.log('- 内存使用:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB');
  console.log('');
  
  // 2. 检查 Firebase 连接
  console.log('🔥 Firebase 连接测试:');
  try {
    const testRef = ref(storage, 'test/connection-test.txt');
    const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    
    const startTime = Date.now();
    await uploadBytes(testRef, testData);
    const uploadTime = Date.now() - startTime;
    
    console.log('✅ Firebase Storage 连接正常');
    console.log(`⏱️  测试上传耗时: ${uploadTime}ms`);
    
    // 获取下载URL测试
    const downloadStartTime = Date.now();
    const downloadURL = await getDownloadURL(testRef);
    const downloadTime = Date.now() - downloadStartTime;
    
    console.log('✅ 获取下载URL成功');
    console.log(`⏱️  获取URL耗时: ${downloadTime}ms`);
    console.log('');
    
  } catch (error) {
    console.log('❌ Firebase Storage 连接失败:', error.message);
    console.log('');
  }
  
  // 3. 检查网络延迟
  console.log('🌐 网络延迟测试:');
  try {
    const testUrls = [
      'https://firebasestorage.googleapis.com',
      'https://storage.googleapis.com',
      'https://www.google.com'
    ];
    
    for (const url of testUrls) {
      const startTime = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const latency = Date.now() - startTime;
      
      console.log(`- ${url}: ${latency}ms ${response.ok ? '✅' : '❌'}`);
    }
    console.log('');
    
  } catch (error) {
    console.log('❌ 网络测试失败:', error.message);
    console.log('');
  }
  
  // 4. 模拟不同大小文件上传
  console.log('📁 文件上传性能测试:');
  const testSizes = [
    { name: '1KB', size: 1024 },
    { name: '10KB', size: 10 * 1024 },
    { name: '100KB', size: 100 * 1024 },
    { name: '1MB', size: 1024 * 1024 }
  ];
  
  for (const testSize of testSizes) {
    try {
      const testData = new Uint8Array(testSize.size);
      const testRef = ref(storage, `test/size-test-${testSize.name}.bin`);
      
      const startTime = Date.now();
      await uploadBytes(testRef, testData);
      const uploadTime = Date.now() - startTime;
      
      const speed = (testSize.size / 1024 / (uploadTime / 1000)).toFixed(2);
      console.log(`- ${testSize.name}: ${uploadTime}ms (${speed} KB/s) ✅`);
      
    } catch (error) {
      console.log(`- ${testSize.name}: 失败 - ${error.message} ❌`);
    }
  }
  console.log('');
  
  // 5. 检查浏览器环境差异
  console.log('🌍 环境差异分析:');
  console.log('本地环境特点:');
  console.log('- 直接连接到 Firebase');
  console.log('- 无服务器端限制');
  console.log('- 本地网络环境');
  console.log('- 开发模式运行');
  console.log('');
  
  console.log('云端环境可能的限制:');
  console.log('- Vercel 函数执行时间限制 (免费版10秒)');
  console.log('- 内存限制 (免费版1024MB)');
  console.log('- 网络延迟 (服务器位置)');
  console.log('- 冷启动延迟');
  console.log('- 并发限制');
  console.log('');
  
  // 6. 建议的解决方案
  console.log('💡 建议的解决方案:');
  console.log('1. 客户端直接上传 (绕过服务器限制)');
  console.log('2. 增加超时时间设置');
  console.log('3. 实现分片上传');
  console.log('4. 添加重试机制');
  console.log('5. 优化图片压缩策略');
  console.log('6. 使用 CDN 加速');
  console.log('');
  
  console.log('🎯 推荐的云端优化配置:');
  console.log('- 使用客户端直接上传到 Firebase Storage');
  console.log('- 设置更长的超时时间 (60-120秒)');
  console.log('- 实现断点续传');
  console.log('- 添加网络状态检测');
  console.log('- 使用 Service Worker 缓存');
}

// 运行诊断
diagnoseUpload().catch(console.error); 