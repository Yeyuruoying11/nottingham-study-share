const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  connectFirestoreEmulator 
} = require('firebase/firestore');

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

async function testChatFunctionality() {
  console.log('🧪 开始测试聊天功能...\n');

  try {
    // 1. 测试基本连接
    console.log('1️⃣ 测试 Firestore 连接...');
    const testDoc = doc(db, 'test', 'connection-test');
    await getDoc(testDoc);
    console.log('✅ Firestore 连接正常\n');

    // 2. 测试 conversations 集合读取权限
    console.log('2️⃣ 测试 conversations 集合读取权限...');
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef);
      const querySnapshot = await getDocs(q);
      console.log(`✅ conversations 集合可读取，当前有 ${querySnapshot.size} 个会话\n`);
    } catch (error) {
      console.log('❌ conversations 集合读取失败:', error.code);
      console.log('错误详情:', error.message, '\n');
    }

    // 3. 测试 messages 集合读取权限
    console.log('3️⃣ 测试 messages 集合读取权限...');
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef);
      const querySnapshot = await getDocs(q);
      console.log(`✅ messages 集合可读取，当前有 ${querySnapshot.size} 条消息\n`);
    } catch (error) {
      console.log('❌ messages 集合读取失败:', error.code);
      console.log('错误详情:', error.message, '\n');
    }

    // 4. 测试 onlineStatus 集合读取权限
    console.log('4️⃣ 测试 onlineStatus 集合读取权限...');
    try {
      const onlineStatusRef = collection(db, 'onlineStatus');
      const q = query(onlineStatusRef);
      const querySnapshot = await getDocs(q);
      console.log(`✅ onlineStatus 集合可读取，当前有 ${querySnapshot.size} 个在线状态记录\n`);
    } catch (error) {
      console.log('❌ onlineStatus 集合读取失败:', error.code);
      console.log('错误详情:', error.message, '\n');
    }

    // 5. 显示 Firestore 安全规则建议
    console.log('📋 Firestore 安全规则建议:');
    console.log('---'.repeat(20));
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户文档
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // 允许其他用户读取基本信息
    }
    
    // 帖子文档
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 评论文档
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 聊天会话 - 新增！
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null 
        && request.auth.uid in request.resource.data.participants;
    }
    
    // 聊天消息 - 新增！
    match /messages/{messageId} {
      allow read: if request.auth != null 
        && exists(/databases/$(database)/documents/conversations/$(resource.data.conversationId))
        && request.auth.uid in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.senderId;
    }
    
    // 在线状态 - 新增！
    match /onlineStatus/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
`);
    console.log('---'.repeat(20));

    console.log('\n🔧 配置步骤:');
    console.log('1. 访问 Firebase Console: https://console.firebase.google.com/project/guidin-db601/firestore/rules');
    console.log('2. 将上述规则复制到编辑器中');
    console.log('3. 点击"发布"按钮');
    console.log('4. 等待几分钟让规则生效');
    console.log('5. 重新测试聊天功能');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testChatFunctionality(); 