const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc,
  setDoc
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

async function createTestChatData() {
  console.log('🚀 开始创建测试聊天数据...\n');

  try {
    // 1. 创建测试用户数据
    console.log('1️⃣ 创建测试用户...');
    
    const testUsers = [
      {
        id: 'test-user-1',
        displayName: '张小明',
        email: 'zhangxiaoming@example.com',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        university: '诺丁汉大学',
        createdAt: new Date()
      },
      {
        id: 'test-user-2', 
        displayName: '李小红',
        email: 'lixiaohong@example.com',
        photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        university: '诺丁汉大学',
        createdAt: new Date()
      },
      {
        id: 'test-user-3',
        displayName: '王小华',
        email: 'wangxiaohua@example.com', 
        photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        university: '诺丁汉大学',
        createdAt: new Date()
      }
    ];

    // 创建测试用户文档
    for (const user of testUsers) {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        createdAt: serverTimestamp()
      });
      console.log(`✅ 创建用户: ${user.displayName}`);
    }

    // 2. 创建测试聊天会话
    console.log('\n2️⃣ 创建测试聊天会话...');
    
    const testConversations = [
      {
        participants: ['test-user-1', 'test-user-2'],
        participantNames: {
          'test-user-1': '张小明',
          'test-user-2': '李小红'
        },
        participantAvatars: {
          'test-user-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          'test-user-2': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
        },
        unreadCount: {
          'test-user-1': 0,
          'test-user-2': 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        participants: ['test-user-1', 'test-user-3'],
        participantNames: {
          'test-user-1': '张小明',
          'test-user-3': '王小华'
        },
        participantAvatars: {
          'test-user-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          'test-user-3': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
        },
        unreadCount: {
          'test-user-1': 2,
          'test-user-3': 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const conversationIds = [];
    
    for (let i = 0; i < testConversations.length; i++) {
      const conversation = testConversations[i];
      const docRef = await addDoc(collection(db, 'conversations'), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      conversationIds.push(docRef.id);
      console.log(`✅ 创建会话: ${conversation.participantNames[conversation.participants[0]]} 和 ${conversation.participantNames[conversation.participants[1]]}`);
    }

    // 3. 创建测试消息
    console.log('\n3️⃣ 创建测试消息...');
    
    const testMessages = [
      // 第一个会话的消息
      {
        conversationId: conversationIds[0],
        senderId: 'test-user-1',
        senderName: '张小明',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        content: '你好！最近怎么样？',
        type: 'text',
        readBy: ['test-user-1'],
        isEdited: false
      },
      {
        conversationId: conversationIds[0],
        senderId: 'test-user-2',
        senderName: '李小红',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        content: '还不错！你呢？学习怎么样？',
        type: 'text',
        readBy: ['test-user-2'],
        isEdited: false
      },
      {
        conversationId: conversationIds[0],
        senderId: 'test-user-1',
        senderName: '张小明',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        content: '还好啦，正在准备期末考试。你有空一起去图书馆吗？',
        type: 'text',
        readBy: ['test-user-1'],
        isEdited: false
      },
      // 第二个会话的消息
      {
        conversationId: conversationIds[1],
        senderId: 'test-user-3',
        senderName: '王小华',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        content: '听说你找到实习了？恭喜！',
        type: 'text',
        readBy: ['test-user-3'],
        isEdited: false
      },
      {
        conversationId: conversationIds[1],
        senderId: 'test-user-3',
        senderName: '王小华',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        content: '可以分享一下经验吗？我也在找实习呢',
        type: 'text',
        readBy: ['test-user-3'],
        isEdited: false
      }
    ];

    for (const message of testMessages) {
      await addDoc(collection(db, 'messages'), {
        ...message,
        timestamp: serverTimestamp()
      });
      console.log(`✅ 创建消息: ${message.senderName} - ${message.content.substring(0, 20)}...`);
    }

    // 4. 更新会话的最后消息
    console.log('\n4️⃣ 更新会话最后消息...');
    
    const { updateDoc } = require('firebase/firestore');
    
    // 更新第一个会话
    await updateDoc(doc(db, 'conversations', conversationIds[0]), {
      lastMessage: {
        content: '还好啦，正在准备期末考试。你有空一起去图书馆吗？',
        senderId: 'test-user-1',
        timestamp: serverTimestamp(),
        type: 'text'
      },
      updatedAt: serverTimestamp()
    });

    // 更新第二个会话
    await updateDoc(doc(db, 'conversations', conversationIds[1]), {
      lastMessage: {
        content: '可以分享一下经验吗？我也在找实习呢',
        senderId: 'test-user-3',
        timestamp: serverTimestamp(),
        type: 'text'
      },
      updatedAt: serverTimestamp()
    });

    console.log('✅ 会话最后消息更新完成');

    // 5. 创建在线状态
    console.log('\n5️⃣ 创建测试在线状态...');
    
    for (const user of testUsers) {
      await setDoc(doc(db, 'onlineStatus', user.id), {
        uid: user.id,
        isOnline: Math.random() > 0.5, // 随机在线状态
        lastSeen: serverTimestamp()
      });
      console.log(`✅ 创建在线状态: ${user.displayName}`);
    }

    console.log('\n🎉 测试聊天数据创建完成！');
    console.log('\n📱 现在你可以：');
    console.log('1. 刷新聊天页面查看测试会话');
    console.log('2. 使用任一测试用户账号登录测试聊天功能');
    console.log('3. 测试用户ID: test-user-1, test-user-2, test-user-3');
    console.log('\n💡 提示: 在真实环境中，用户需要通过用户资料页面发起聊天');

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 运行脚本
createTestChatData(); 