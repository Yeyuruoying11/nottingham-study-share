const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

async function createTestPost() {
  try {
    console.log('📝 创建测试帖子...\n');
    
    const testPost = {
      title: "测试分类功能",
      content: "这是一个测试帖子，用于验证分类功能是否正常工作。",
      fullContent: "这是一个测试帖子，用于验证分类功能是否正常工作。如果你能在对应的分类中看到这个帖子，说明分类功能正常。",
      category: "学习", // 设置为"学习"分类
      tags: ["测试", "分类", "功能"],
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      author: {
        name: "测试用户",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        university: "诺丁汉大学",
        year: "学生",
        uid: "test-user-123"
      },
      likes: 0,
      likedBy: [],
      comments: 0,
      createdAt: serverTimestamp()
    };
    
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, testPost);
    
    console.log(`✅ 测试帖子创建成功！`);
    console.log(`   ID: ${docRef.id}`);
    console.log(`   标题: ${testPost.title}`);
    console.log(`   分类: ${testPost.category}`);
    console.log(`   标签: ${testPost.tags.join(', ')}`);
    
  } catch (error) {
    console.error('❌ 创建测试帖子失败:', error);
  }
  
  process.exit(0);
}

createTestPost(); 