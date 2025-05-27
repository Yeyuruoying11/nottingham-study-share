// 测试点赞功能脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

async function testLikeFunction() {
  console.log('🧪 开始测试点赞功能...\n');

  try {
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 1. 获取所有帖子
    console.log('1. 获取所有帖子...');
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    if (snapshot.size === 0) {
      console.log('❌ 没有找到帖子，请先运行数据迁移');
      return;
    }

    const posts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        likes: data.likes || 0,
        likedBy: data.likedBy || []
      });
    });

    console.log(`✅ 找到 ${posts.length} 个帖子\n`);

    // 2. 显示当前点赞状态
    console.log('2. 当前点赞状态：');
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}"`);
      console.log(`      点赞数: ${post.likes}`);
      console.log(`      点赞用户: [${post.likedBy.join(', ')}]`);
      console.log('');
    });

    // 3. 测试点赞功能
    if (posts.length > 0) {
      const testPost = posts[0];
      const testUserId = 'test-user-like';
      
      console.log(`3. 测试点赞功能 - 帖子: "${testPost.title}"`);
      
      // 检查用户是否已经点赞
      const isLiked = testPost.likedBy.includes(testUserId);
      console.log(`   当前状态: ${isLiked ? '已点赞' : '未点赞'}`);
      
      const postRef = doc(db, 'posts', testPost.id);
      
      if (isLiked) {
        // 取消点赞
        console.log('   执行: 取消点赞...');
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(testUserId)
        });
        console.log('   ✅ 取消点赞成功');
      } else {
        // 添加点赞
        console.log('   执行: 添加点赞...');
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(testUserId)
        });
        console.log('   ✅ 添加点赞成功');
      }

      // 4. 验证结果
      console.log('\n4. 验证结果...');
      const updatedSnapshot = await getDocs(postsRef);
      const updatedPosts = [];
      updatedSnapshot.forEach((doc) => {
        const data = doc.data();
        updatedPosts.push({
          id: doc.id,
          title: data.title,
          likes: data.likes || 0,
          likedBy: data.likedBy || []
        });
      });

      const updatedTestPost = updatedPosts.find(p => p.id === testPost.id);
      console.log(`   更新后点赞数: ${updatedTestPost.likes}`);
      console.log(`   更新后点赞用户: [${updatedTestPost.likedBy.join(', ')}]`);
      
      // 验证数据一致性
      const expectedLikes = updatedTestPost.likedBy.length;
      if (updatedTestPost.likes === expectedLikes) {
        console.log('   ✅ 数据一致性检查通过');
      } else {
        console.log(`   ❌ 数据不一致: 点赞数(${updatedTestPost.likes}) != 点赞用户数(${expectedLikes})`);
      }
    }

    console.log('\n🎉 点赞功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n可能的问题：');
    console.log('1. Firebase配置错误');
    console.log('2. 网络连接问题');
    console.log('3. Firestore安全规则限制');
  }
}

// 运行测试
testLikeFunction()
  .then(() => {
    console.log('\n✨ 测试脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 