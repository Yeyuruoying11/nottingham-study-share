const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase配置 - 请根据你的实际配置修改
const firebaseConfig = {
  // 你需要从你的Firebase控制台获取这些信息
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugUserPosts() {
  try {
    console.log('🔍 开始调试帖子数据...');
    
    // 获取所有帖子
    const postsCollection = collection(db, 'posts');
    const querySnapshot = await getDocs(postsCollection);
    
    console.log(`📊 总共找到 ${querySnapshot.size} 个帖子`);
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📝 帖子 ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   标题: ${data.title}`);
      console.log(`   作者信息:`, {
        name: data.author?.name,
        uid: data.author?.uid,
        avatar: data.author?.avatar
      });
      console.log(`   是否有author.uid: ${data.author?.uid ? '✅ 有' : '❌ 无'}`);
      console.log(`   创建时间: ${data.createdAt?.toDate?.() || data.createdAt}`);
    });
    
    // 统计有uid和没有uid的帖子数量
    let withUid = 0;
    let withoutUid = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.author?.uid) {
        withUid++;
      } else {
        withoutUid++;
      }
    });
    
    console.log(`\n📈 统计结果:`);
    console.log(`   有 author.uid 的帖子: ${withUid} 个`);
    console.log(`   没有 author.uid 的帖子: ${withoutUid} 个`);
    
    if (withoutUid > 0) {
      console.log(`\n⚠️  发现问题: 有 ${withoutUid} 个帖子缺少 author.uid 字段`);
      console.log(`   这可能是导致用户个人资料页面无法显示帖子的原因`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  debugUserPosts();
}

module.exports = { debugUserPosts }; 