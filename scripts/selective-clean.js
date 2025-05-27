// 选择性清理测试数据脚本
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

async function selectiveClean() {
  console.log('🔍 查看当前帖子数据...\n');

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

    // 整理帖子数据
    const posts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        author: data.author?.name || '未知作者',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        image: data.image,
        content: data.content?.substring(0, 100) + '...' || '无内容'
      });
    });

    // 按时间排序
    posts.sort((a, b) => b.createdAt - a.createdAt);

    console.log(`📋 找到 ${posts.length} 个帖子：\n`);
    
    // 显示所有帖子
    posts.forEach((post, index) => {
      const timeStr = post.createdAt.toLocaleString('zh-CN');
      console.log(`${index + 1}. 📝 "${post.title}"`);
      console.log(`   👤 作者: ${post.author}`);
      console.log(`   📅 时间: ${timeStr}`);
      console.log(`   📄 内容: ${post.content}`);
      console.log(`   🖼️  图片: ${post.image ? '有' : '无'}`);
      console.log('');
    });

    // 识别可能的测试帖子
    const testKeywords = [
      '测试', 'test', '示例', '样例', 'demo', 
      '诺丁汉大学生活指南', '英国留学必备APP推荐',
      '诺丁汉美食探店', '租房攻略', '学习经验分享'
    ];
    
    const testPosts = posts.filter(post => 
      testKeywords.some(keyword => 
        post.title.toLowerCase().includes(keyword.toLowerCase()) ||
        post.author.toLowerCase().includes(keyword.toLowerCase()) ||
        post.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (testPosts.length > 0) {
      console.log('🎯 识别到的可能测试帖子：');
      testPosts.forEach((post, index) => {
        const postIndex = posts.findIndex(p => p.id === post.id) + 1;
        console.log(`   ${postIndex}. "${post.title}" - ${post.author}`);
      });
      console.log('');
    }

    // 提供删除选项
    console.log('🗑️  删除选项：');
    console.log('   A. 删除所有帖子（完全清空）');
    console.log('   B. 只删除识别到的测试帖子');
    console.log('   C. 手动选择要删除的帖子');
    console.log('   D. 不删除，仅查看');
    console.log('');
    console.log('请在网页界面中手动删除不需要的帖子，或者运行以下命令：');
    console.log('');
    console.log('删除所有帖子：');
    console.log('node scripts/clean-test-data.js');
    console.log('');
    console.log('💡 建议：');
    console.log('1. 访问 http://localhost:3001 查看网站');
    console.log('2. 登录你的账户');
    console.log('3. 在首页点击帖子右上角的三个点菜单');
    console.log('4. 选择"删除"来删除不需要的帖子');
    console.log('');
    console.log('这样可以确保只删除你想删除的帖子，避免误删。');

  } catch (error) {
    console.error('❌ 查看失败:', error.message);
  }
}

// 运行查看
selectiveClean()
  .then(() => {
    console.log('\n✨ 查看完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 