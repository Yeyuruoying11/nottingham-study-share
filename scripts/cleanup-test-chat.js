const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  doc
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

async function cleanupTestChatData() {
  console.log('🧹 开始清理测试聊天数据...\n');

  try {
    const testUserIds = ['test-user-1', 'test-user-2', 'test-user-3'];

    // 1. 删除测试用户
    console.log('1️⃣ 删除测试用户...');
    for (const userId of testUserIds) {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`✅ 删除用户: ${userId}`);
    }

    // 2. 删除包含测试用户的会话
    console.log('\n2️⃣ 删除测试会话...');
    const conversationsRef = collection(db, 'conversations');
    
    for (const userId of testUserIds) {
      const q = query(conversationsRef, where('participants', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        console.log(`✅ 删除会话: ${docSnapshot.id}`);
      }
    }

    // 3. 删除测试消息
    console.log('\n3️⃣ 删除测试消息...');
    const messagesRef = collection(db, 'messages');
    
    for (const userId of testUserIds) {
      const q = query(messagesRef, where('senderId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        console.log(`✅ 删除消息: ${docSnapshot.id}`);
      }
    }

    // 4. 删除测试在线状态
    console.log('\n4️⃣ 删除测试在线状态...');
    for (const userId of testUserIds) {
      await deleteDoc(doc(db, 'onlineStatus', userId));
      console.log(`✅ 删除在线状态: ${userId}`);
    }

    console.log('\n🎉 测试聊天数据清理完成！');
    console.log('\n💡 提示: 现在聊天页面将显示空状态，你可以通过用户资料页面发起真实的聊天。');

  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
  }
}

// 运行清理脚本
cleanupTestChatData(); 