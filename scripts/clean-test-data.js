// 清理测试数据脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');
const { getStorage, ref, deleteObject, listAll } = require('firebase/storage');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

async function cleanTestData() {
  console.log('🧹 开始清理测试数据...\n');

  try {
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // 1. 获取所有帖子
    console.log('1. 获取所有帖子...');
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    console.log(`   找到 ${snapshot.size} 个帖子\n`);

    if (snapshot.size === 0) {
      console.log('✅ 没有找到帖子，数据库已经是干净的！');
      return;
    }

    // 2. 显示所有帖子供用户选择
    const posts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        author: data.author?.name || '未知作者',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        image: data.image
      });
    });

    console.log('2. 当前帖子列表：');
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}" - 作者: ${post.author} - 时间: ${post.createdAt.toLocaleString()}`);
    });
    console.log('');

    // 3. 识别可能的测试帖子
    const testKeywords = ['测试', 'test', '示例', '样例', 'demo', '诺丁汉大学生活指南', '英国留学必备APP推荐'];
    const testPosts = posts.filter(post => 
      testKeywords.some(keyword => 
        post.title.toLowerCase().includes(keyword.toLowerCase()) ||
        post.author.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (testPosts.length > 0) {
      console.log('3. 识别到的可能测试帖子：');
      testPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.title}" - 作者: ${post.author}`);
      });
      console.log('');
    }

    // 4. 删除所有帖子（包括关联的图片）
    console.log('4. 开始删除帖子...');
    let deletedCount = 0;
    let deletedImages = 0;

    for (const post of posts) {
      try {
        // 删除关联的图片
        if (post.image && post.image.includes('firebasestorage.googleapis.com')) {
          try {
            // 从URL提取文件路径
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
        console.log(`   ❌ 删除帖子失败: "${post.title}" - ${error.message}`);
      }
    }

    // 5. 清理可能的孤立图片
    console.log('\n5. 检查并清理孤立图片...');
    try {
      const storageRef = ref(storage, 'posts');
      const listResult = await listAll(storageRef);
      
      for (const itemRef of listResult.items) {
        try {
          await deleteObject(itemRef);
          deletedImages++;
          console.log(`   ✅ 删除孤立图片: ${itemRef.fullPath}`);
        } catch (error) {
          console.log(`   ⚠️  删除图片失败: ${itemRef.fullPath} - ${error.message}`);
        }
      }

      // 递归删除子文件夹
      for (const folderRef of listResult.prefixes) {
        try {
          const subList = await listAll(folderRef);
          for (const subItem of subList.items) {
            await deleteObject(subItem);
            deletedImages++;
            console.log(`   ✅ 删除图片: ${subItem.fullPath}`);
          }
        } catch (error) {
          console.log(`   ⚠️  删除文件夹失败: ${folderRef.fullPath}`);
        }
      }
    } catch (storageError) {
      console.log(`   ⚠️  清理Storage失败: ${storageError.message}`);
    }

    console.log('\n🎉 清理完成！');
    console.log(`   删除帖子: ${deletedCount} 个`);
    console.log(`   删除图片: ${deletedImages} 个`);
    console.log('\n数据库现在是干净的，可以开始正式使用了！');

  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    console.log('\n如果遇到权限问题，请确保：');
    console.log('1. Firebase项目配置正确');
    console.log('2. Firestore和Storage安全规则允许删除操作');
    console.log('3. 网络连接正常');
  }
}

// 运行清理
cleanTestData()
  .then(() => {
    console.log('\n✨ 脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 