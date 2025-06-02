const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBJJXPq0x0hT-6B-GwpVu5YmwPFKNjkJz0",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "843377802440",
  appId: "1:843377802440:web:c3778b2a4a01e08f1c416f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCategories() {
  try {
    console.log('🔍 开始测试Firebase分类查询...\n');
    
    // 1. 获取所有帖子
    const postsRef = collection(db, 'posts');
    const allPostsSnapshot = await getDocs(postsRef);
    
    console.log(`📊 总帖子数: ${allPostsSnapshot.size}`);
    console.log('\n📝 所有帖子详情:');
    
    const categoryCount = {};
    allPostsSnapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category || '未分类';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      console.log(`- ID: ${doc.id}`);
      console.log(`  标题: ${data.title}`);
      console.log(`  分类: ${category}`);
      console.log(`  作者: ${data.author?.name || '未知'}`);
      console.log('');
    });
    
    console.log('\n📊 分类统计:');
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count} 个帖子`);
    });
    
    // 2. 测试各个分类的查询
    const categories = ['生活', '美食', '学习', '旅行', '资料', '租房'];
    
    console.log('\n🔍 测试分类查询:');
    for (const cat of categories) {
      const categoryQuery = query(postsRef, where('category', '==', cat));
      const categorySnapshot = await getDocs(categoryQuery);
      
      console.log(`\n📁 ${cat} 分类:`);
      console.log(`  查询结果: ${categorySnapshot.size} 个帖子`);
      
      if (categorySnapshot.size > 0) {
        console.log('  帖子列表:');
        categorySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`  - ${data.title} (ID: ${doc.id})`);
        });
      }
    }
    
    // 3. 检查是否有分类字段问题
    console.log('\n⚠️  检查分类字段问题:');
    let problemCount = 0;
    allPostsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.category || data.category.trim() === '') {
        problemCount++;
        console.log(`- 帖子 "${data.title}" (ID: ${doc.id}) 没有分类`);
      }
    });
    
    if (problemCount === 0) {
      console.log('✅ 所有帖子都有正确的分类');
    } else {
      console.log(`\n❌ 发现 ${problemCount} 个帖子没有分类`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
  
  process.exit(0);
}

testCategories(); 