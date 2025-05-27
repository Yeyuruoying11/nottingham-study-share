const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function deleteAllPosts() {
  try {
    console.log('🗑️  开始删除所有帖子...\n');
    
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    console.log(`找到 ${snapshot.size} 个帖子\n`);
    
    let deletedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log(`删除帖子: "${data.title}" (ID: ${docSnap.id})`);
      
      await deleteDoc(doc(db, 'posts', docSnap.id));
      deletedCount++;
    }
    
    console.log(`\n✅ 删除完成！共删除了 ${deletedCount} 个帖子`);
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  }
  
  process.exit(0);
}

// 确认删除
console.log('⚠️  警告：这将删除所有帖子！');
console.log('按 Ctrl+C 取消，或等待 3 秒继续...\n');

setTimeout(() => {
  deleteAllPosts();
}, 3000); 