import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Conversation, ChatMessage, UserOnlineStatus } from './types';

// 集合引用
export const conversationsCollection = collection(db, 'conversations');
export const messagesCollection = collection(db, 'messages');
export const onlineStatusCollection = collection(db, 'onlineStatus');

// ==================== 图片上传功能 ====================

// 上传聊天图片
export async function uploadChatImage(
  file: File,
  userId: string,
  conversationId: string
): Promise<string> {
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('请选择图片文件');
    }

    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('图片文件不能超过5MB');
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `chat-images/${conversationId}/${userId}_${timestamp}_${randomString}.${fileExtension}`;

    // 创建存储引用
    const storageRef = ref(storage, fileName);

    // 上传文件
    console.log('开始上传聊天图片:', fileName);
    const snapshot = await uploadBytes(storageRef, file);
    
    // 获取下载URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('聊天图片上传成功:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('聊天图片上传失败:', error);
    throw error;
  }
}

// ==================== 会话管理 ====================

// 创建或获取两人之间的会话
export async function getOrCreateConversation(
  currentUserId: string, 
  targetUserId: string,
  currentUserName: string,
  currentUserAvatar: string,
  targetUserName: string,
  targetUserAvatar: string
): Promise<string> {
  try {
    console.log('🔍 查找现有会话...');
    console.log('参数:', {
      currentUserId,
      targetUserId,
      currentUserName,
      targetUserName
    });

    // 查找现有会话（两人之间的会话）
    const q = query(
      conversationsCollection,
      where('participants', 'array-contains', currentUserId)
    );
    
    console.log('📋 执行 Firestore 查询...');
    const querySnapshot = await getDocs(q);
    console.log(`📊 查询到 ${querySnapshot.size} 个包含当前用户的会话`);
    
    for (const docSnapshot of querySnapshot.docs) {
      const conversation = docSnapshot.data() as Conversation;
      console.log('🔎 检查会话:', {
        id: docSnapshot.id,
        participants: conversation.participants
      });
      
      if (conversation.participants.includes(targetUserId) && conversation.participants.length === 2) {
        console.log('✅ 找到现有会话:', docSnapshot.id);
        return docSnapshot.id;
      }
    }
    
    console.log('🆕 没有找到现有会话，创建新会话...');
    
    // 如果没有找到现有会话，创建新会话
    const newConversation: Omit<Conversation, 'id'> = {
      participants: [currentUserId, targetUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [targetUserId]: targetUserName
      },
      participantAvatars: {
        [currentUserId]: currentUserAvatar,
        [targetUserId]: targetUserAvatar
      },
      unreadCount: {
        [currentUserId]: 0,
        [targetUserId]: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 准备创建的会话数据:', JSON.stringify(newConversation, null, 2));
    
    const docRef = await addDoc(conversationsCollection, {
      ...newConversation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('🎉 创建新会话成功:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('💥 获取或创建会话失败:', error);
    
    // 记录详细的错误信息
    if (error instanceof Error) {
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    // 检查常见错误类型
    if (error instanceof Error && error.message.includes('permission-denied')) {
      throw new Error('权限不足：无法创建聊天会话。请确保已登录并拥有相应权限。');
    } else if (error instanceof Error && error.message.includes('unavailable')) {
      throw new Error('服务暂时不可用：请检查网络连接并重试。');
    } else if (error instanceof Error && error.message.includes('quota-exceeded')) {
      throw new Error('服务使用量超限：请稍后重试。');
    }
    
    throw error;
  }
}

// 获取用户的所有会话
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      conversationsCollection,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const conversations: Conversation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date()
        } : undefined
      } as Conversation);
    });
    
    return conversations;
  } catch (error) {
    console.error('获取用户会话失败:', error);
    return [];
  }
}

// 实时监听用户会话
export function subscribeToUserConversations(
  userId: string, 
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    conversationsCollection,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(
    q, 
    (querySnapshot) => {
      console.log('Firestore 会话查询成功，文档数量:', querySnapshot.size);
      
      const conversations: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
          } : undefined
        } as Conversation);
      });
      
      console.log('处理后的会话数据:', conversations);
      callback(conversations);
    },
    (error) => {
      console.error('监听用户会话失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误信息:', error.message);
      
      // 即使出错也要调用回调，返回空数组
      callback([]);
    }
  );
}

// ==================== 消息管理 ====================

// 发送消息
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  content: string,
  type: 'text' | 'image' = 'text'
): Promise<string> {
  try {
    console.log('🚀 开始发送消息:', {
      conversationId,
      senderId,
      senderName,
      content: content.substring(0, 50) + '...'
    });

    // 验证参数
    if (!conversationId || !senderId || !content || !senderName) {
      throw new Error('发送消息缺少必要参数');
    }

    // 创建消息
    const newMessage: Omit<ChatMessage, 'id'> = {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type,
      timestamp: new Date(),
      readBy: [senderId], // 发送者默认已读
      isEdited: false
    };
    
    console.log('📝 准备添加消息到 Firestore...');
    
    const messageRef = await addDoc(messagesCollection, {
      ...newMessage,
      timestamp: serverTimestamp()
    });
    
    console.log('✅ 消息已成功添加到 Firestore，ID:', messageRef.id);
    
    // 更新会话的最后消息和未读计数
    const conversationRef = doc(conversationsCollection, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const conversation = conversationDoc.data() as Conversation;
      const updatedUnreadCount = { ...conversation.unreadCount };
      
      // 为除发送者外的所有参与者增加未读计数
      conversation.participants.forEach(participantId => {
        if (participantId !== senderId) {
          updatedUnreadCount[participantId] = (updatedUnreadCount[participantId] || 0) + 1;
        }
      });
      
      console.log('📊 更新会话信息...');
      
      await updateDoc(conversationRef, {
        lastMessage: {
          content: content,
          senderId: senderId,
          timestamp: serverTimestamp(),
          type: type
        },
        unreadCount: updatedUnreadCount,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ 会话信息更新成功');
    } else {
      console.warn('⚠️ 会话不存在:', conversationId);
    }
    
    console.log('🎉 消息发送完全成功:', messageRef.id);
    return messageRef.id;
    
  } catch (error) {
    console.error('❌ 发送消息失败:', error);
    
    // 更详细的错误信息
    if (error instanceof Error) {
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      
      // 检查是否是权限错误
      if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
        console.error('📛 权限错误 - 请检查 Firestore 规则');
        console.error('当前发送者 ID:', senderId);
        console.error('会话 ID:', conversationId);
      }
    }
    
    throw error;
  }
}

// 获取会话的消息
export async function getConversationMessages(
  conversationId: string, 
  limitCount: number = 50
): Promise<ChatMessage[]> {
  try {
    const q = query(
      messagesCollection,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    const messages: ChatMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        editedAt: data.editedAt?.toDate()
      } as ChatMessage);
    });
    
    // 按时间正序返回（最新的在后面）
    return messages.reverse();
  } catch (error) {
    console.error('获取会话消息失败:', error);
    return [];
  }
}

// 实时监听会话消息
export function subscribeToConversationMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
  limitCount: number = 50
) {
  const q = query(
    messagesCollection,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages: ChatMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        editedAt: data.editedAt?.toDate()
      } as ChatMessage);
    });
    
    // 按时间正序返回（最新的在后面）
    callback(messages.reverse());
  });
}

// 标记消息为已读
export async function markMessagesAsRead(
  conversationId: string, 
  userId: string
): Promise<void> {
  try {
    // 获取会话中用户未读的消息
    const q = query(
      messagesCollection,
      where('conversationId', '==', conversationId),
      where('readBy', 'not-in', [[userId]])
    );
    
    const querySnapshot = await getDocs(q);
    
    // 批量更新消息为已读
    const updatePromises = querySnapshot.docs.map(messageDoc => {
      return updateDoc(messageDoc.ref, {
        readBy: arrayUnion(userId)
      });
    });
    
    await Promise.all(updatePromises);
    
    // 重置会话的未读计数
    const conversationRef = doc(conversationsCollection, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const conversation = conversationDoc.data() as Conversation;
      const updatedUnreadCount = { ...conversation.unreadCount };
      updatedUnreadCount[userId] = 0;
      
      await updateDoc(conversationRef, {
        unreadCount: updatedUnreadCount
      });
    }
    
    console.log('消息已标记为已读');
  } catch (error) {
    console.error('标记消息已读失败:', error);
    throw error;
  }
}

// ==================== 在线状态管理 ====================

// 更新用户在线状态
export async function updateUserOnlineStatus(
  userId: string, 
  isOnline: boolean
): Promise<void> {
  try {
    const statusRef = doc(onlineStatusCollection, userId);
    
    await updateDoc(statusRef, {
      uid: userId,
      isOnline: isOnline,
      lastSeen: serverTimestamp()
    });
    
    console.log(`用户 ${userId} 在线状态更新为: ${isOnline}`);
  } catch (error) {
    // 如果文档不存在，创建新文档
    if (error instanceof Error && error.message.includes('No document to update')) {
      try {
        await addDoc(onlineStatusCollection, {
          uid: userId,
          isOnline: isOnline,
          lastSeen: serverTimestamp()
        });
      } catch (createError) {
        console.error('创建在线状态失败:', createError);
      }
    } else {
      console.error('更新在线状态失败:', error);
    }
  }
}

// 获取用户在线状态
export async function getUserOnlineStatus(userId: string): Promise<UserOnlineStatus | null> {
  try {
    const statusRef = doc(onlineStatusCollection, userId);
    const statusDoc = await getDoc(statusRef);
    
    if (statusDoc.exists()) {
      const data = statusDoc.data();
      return {
        uid: data.uid,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen?.toDate() || new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取在线状态失败:', error);
    return null;
  }
}

// 实时监听用户在线状态
export function subscribeToUserOnlineStatus(
  userId: string,
  callback: (status: UserOnlineStatus | null) => void
) {
  const statusRef = doc(onlineStatusCollection, userId);
  
  return onSnapshot(statusRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        uid: data.uid,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen?.toDate() || new Date()
      });
    } else {
      callback(null);
    }
  });
}

// ==================== 工具函数 ====================

// 格式化时间显示
export function formatMessageTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 今天
  if (now.toDateString() === timestamp.toDateString()) {
    return timestamp.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === timestamp.toDateString()) {
    return `昨天 ${timestamp.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  // 其他时间
  return timestamp.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取会话的对方用户信息
export function getOtherParticipant(conversation: Conversation, currentUserId: string) {
  const otherUserId = conversation.participants.find(id => id !== currentUserId);
  if (!otherUserId) return null;
  
  return {
    id: otherUserId,
    name: conversation.participantNames[otherUserId] || '未知用户',
    avatar: conversation.participantAvatars[otherUserId] || ''
  };
} 