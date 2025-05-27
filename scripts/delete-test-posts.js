// 只删除测试帖子的脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { getStorage, ref, deleteObject } = require('firebase/storage');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

async function deleteTestPosts() {
  console.log('🎯 只删除测试帖子...\n');

  try {
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // 获取所有帖子
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    if (snapshot.size === 0) {
      console.log('✅ 数据库中没有帖子！');
      return;
    }

    // 查找测试帖子
    const testKeywords = ['测试', 'test', '可以删除', 'demo'];
    const testPosts = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const title = data.title || '';
      const author = data.author?.name || '';
      const content = data.content || '';
      
      // 检查是否为测试帖子
      const isTestPost = testKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase()) ||
        author.toLowerCase().includes(keyword.toLowerCase()) ||
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isTestPost) {
        testPosts.push({
          id: doc.id,
          title: title,
          author: author,
          image: data.image
        });
      }
    });

    if (testPosts.length === 0) {
      console.log('✅ 没有找到测试帖子！');
      return;
    }

    console.log(`找到 ${testPosts.length} 个测试帖子：`);
    testPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}" - 作者: ${post.author}`);
    });
    console.log('');

    // 删除测试帖子
    let deletedCount = 0;
    let deletedImages = 0;

    for (const post of testPosts) {
      try {
        // 删除关联的图片
        if (post.image && post.image.includes('firebasestorage.googleapis.com')) {
          try {
            const url = new URL(post.image);
            const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              const imageRef = ref(storage, filePath);
              await deleteObject(imageRef);
              deletedImages++;
              console.log(`   ✅ 删除图片: ${filePath}`);
            }
          } catch (imageError) {
            console.log(`   ⚠️  删除图片失败: ${imageError.message}`);
          }
        }

        // 删除帖子文档
        await deleteDoc(doc(db, 'posts', post.id));
        deletedCount++;
        console.log(`   ✅ 删除帖子: "${post.title}"`);

      } catch (error) {
        console.log(`   ❌ 删除失败: "${post.title}" - ${error.message}`);
      }
    }

    console.log('\n🎉 测试帖子清理完成！');
    console.log(`   删除帖子: ${deletedCount} 个`);
    console.log(`   删除图片: ${deletedImages} 个`);
    console.log('\n保留的正常帖子不受影响。');

  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  }
}

// 运行清理
deleteTestPosts()
  .then(() => {
    console.log('\n✨ 脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 