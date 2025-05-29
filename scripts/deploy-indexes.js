const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查 Firebase CLI 是否安装
function checkFirebaseCLI() {
  return new Promise((resolve) => {
    const process = spawn('firebase', ['--version'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}

// 部署索引
async function deployIndexes() {
  console.log('🔍 检查 Firebase CLI...');
  
  const hasFirebaseCLI = await checkFirebaseCLI();
  
  if (!hasFirebaseCLI) {
    console.log('❌ Firebase CLI 未安装');
    console.log('请先安装 Firebase CLI:');
    console.log('npm install -g firebase-tools');
    console.log('然后运行: firebase login');
    return;
  }
  
  console.log('✅ Firebase CLI 已安装');
  
  // 检查索引文件是否存在
  const indexesFile = path.join(process.cwd(), 'firestore.indexes.json');
  if (!fs.existsSync(indexesFile)) {
    console.log('❌ firestore.indexes.json 文件不存在');
    return;
  }
  
  console.log('📋 开始部署 Firestore 索引...');
  
  // 部署索引
  const deployProcess = spawn('firebase', ['deploy', '--only', 'firestore:indexes'], {
    stdio: 'inherit'
  });
  
  deployProcess.on('close', (code) => {
    if (code === 0) {
      console.log('🎉 索引部署成功！');
      console.log('📝 索引创建可能需要几分钟时间');
      console.log('💡 你可以在 Firebase Console 中查看索引创建进度');
    } else {
      console.log('❌ 索引部署失败');
      console.log('请确保已登录 Firebase: firebase login');
    }
  });
  
  deployProcess.on('error', (error) => {
    console.error('❌ 部署过程中出错:', error.message);
  });
}

// 手动创建索引的说明
function showManualInstructions() {
  console.log('\n📖 如果自动部署失败，你可以手动创建索引：');
  console.log('1. 访问 Firebase Console: https://console.firebase.google.com/');
  console.log('2. 选择项目: guidin-db601');
  console.log('3. 进入 Firestore Database > 索引');
  console.log('4. 创建以下复合索引：');
  console.log('\n🔹 conversations 索引：');
  console.log('  - participants (数组包含)');
  console.log('  - updatedAt (降序)');
  console.log('\n🔹 messages 索引：');
  console.log('  - conversationId (升序)');
  console.log('  - timestamp (降序)');
}

// 主函数
async function main() {
  console.log('🚀 开始创建 Firestore 索引...\n');
  
  try {
    await deployIndexes();
  } catch (error) {
    console.error('💥 部署失败:', error.message);
  }
  
  showManualInstructions();
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { deployIndexes }; 