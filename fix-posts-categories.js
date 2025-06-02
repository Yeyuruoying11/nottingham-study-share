const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function fixCategories() {
  try {
    console.log('🔧 开始修复帖子分类...\n');
    
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    let fixedCount = 0;
    const validCategories = ['生活', '美食', '学习', '旅行', '资料', '租房'];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let needsUpdate = false;
      const updates = {};
      
      // 检查分类是否有效
      if (!data.category || !validCategories.includes(data.category)) {
        updates.category = '生活'; // 默认分类
        needsUpdate = true;
        console.log(`修复帖子 "${data.title}" (ID: ${docSnap.id}) - 设置分类为"生活"`);
      }
      
      // 确保分类是字符串类型
      if (typeof data.category !== 'string') {
        updates.category = String(data.category || '生活');
        needsUpdate = true;
        console.log(`修复帖子 "${data.title}" (ID: ${docSnap.id}) - 转换分类为字符串`);
      }
      
      // 去除分类的空格
      if (data.category && data.category.trim() !== data.category) {
        updates.category = data.category.trim();
        needsUpdate = true;
        console.log(`修复帖子 "${data.title}" (ID: ${docSnap.id}) - 去除分类空格`);
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, 'posts', docSnap.id), updates);
        fixedCount++;
      }
    }
    
    console.log(`\n✅ 修复完成！共修复了 ${fixedCount} 个帖子`);
    
    // 再次验证
    console.log('\n📊 验证修复结果:');
    const verifySnapshot = await getDocs(postsRef);
    const categoryCount = {};
    
    verifySnapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count} 个帖子`);
    });
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
  
  process.exit(0);
}

fixCategories(); 