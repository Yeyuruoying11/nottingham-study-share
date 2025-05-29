const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "831633555817",
  appId: "1:831633555817:web:cf598c871c41f83a4dfdf8",
  measurementId: "G-EHKPF1364Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testChatFunction() {
  try {
    console.log('🚀 开始测试聊天功能...\n');
    
    // 1. 测试登录
    console.log('1️⃣ 测试用户登录...');
    const email = 'taoyihaoyy@gmail.com';
    const password = '20020730';
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ 登录成功: ${userCredential.user.email} (UID: ${userCredential.user.uid})\n`);
    
    // 2. 测试创建会话
    console.log('2️⃣ 测试创建聊天会话...');
    
    const conversationsCollection = collection(db, 'conversations');
    
    // 模拟创建会话数据
    const testConversation = {
      participants: [userCredential.user.uid, 'test-user-123'],
      participantNames: {
        [userCredential.user.uid]: userCredential.user.displayName || '测试用户',
        'test-user-123': '张小明'
      },
      participantAvatars: {
        [userCredential.user.uid]: userCredential.user.photoURL || '',
        'test-user-123': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      },
      unreadCount: {
        [userCredential.user.uid]: 0,
        'test-user-123': 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('📝 准备创建的会话数据:', JSON.stringify(testConversation, null, 2));
    
    const docRef = await addDoc(conversationsCollection, testConversation);
    console.log(`✅ 会话创建成功! ID: ${docRef.id}\n`);
    
    // 3. 测试查询会话
    console.log('3️⃣ 测试查询用户会话...');
    
    const q = query(
      conversationsCollection,
      where('participants', 'array-contains', userCredential.user.uid)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 查询到 ${querySnapshot.size} 个会话`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`会话 ${doc.id}:`, {
        participants: data.participants,
        participantNames: data.participantNames
      });
    });
    
    console.log('\n✅ 聊天功能测试完成！');
    console.log('\n📋 测试结果:');
    console.log('- ✅ 用户登录正常');
    console.log('- ✅ 会话创建正常');
    console.log('- ✅ 会话查询正常');
    console.log('\n🎉 聊天功能工作正常，可能是前端调用或权限问题。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔒 权限错误原因分析:');
      console.error('1. Firestore 规则可能不允许创建 conversations 集合');
      console.error('2. 需要在 Firebase Console 中更新 Firestore 规则');
      console.error('3. 请检查 firestore.rules 文件是否正确部署');
    } else if (error.code === 'not-found') {
      console.error('\n📂 数据库错误:');
      console.error('1. conversations 集合可能不存在');
      console.error('2. 数据库索引可能需要创建');
    }
  }
}

// 运行测试
testChatFunction(); 