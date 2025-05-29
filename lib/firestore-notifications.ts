import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from './types';

// 创建通知
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('通知创建成功:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
}

// 管理员发送系统通知给所有用户
export async function sendSystemNotification(
  title: string, 
  message: string, 
  adminId: string
): Promise<void> {
  try {
    // 获取所有用户
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const batch = writeBatch(db);
    
    // 为每个用户创建通知
    usersSnapshot.docs.forEach((userDoc) => {
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        userId: userDoc.id,
        type: 'system',
        title,
        message,
        read: false,
        isSystemNotification: true,
        adminId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('系统通知发送成功');
  } catch (error) {
    console.error('发送系统通知失败:', error);
    throw error;
  }
}

// 获取用户的通知列表（简化版，减少索引依赖）
export async function getUserNotifications(userId: string, limitCount: number = 20): Promise<Notification[]> {
  try {
    // 使用更简单的查询，避免复合索引
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Notification;
    });

    // 在客户端排序，避免orderBy索引要求
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('获取通知失败:', error);
    throw error;
  }
}

// 获取用户未读通知数量
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    return snapshot.size;
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    return 0;
  }
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: serverTimestamp()
    });
    console.log('通知已标记为已读:', notificationId);
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    throw error;
  }
}

// 标记所有通知为已读
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('所有通知已标记为已读');
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    throw error;
  }
}

// 删除通知
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    console.log('通知删除成功:', notificationId);
  } catch (error) {
    console.error('删除通知失败:', error);
    throw error;
  }
}

// 创建互动通知（点赞、评论等）
export async function createInteractionNotification(
  targetUserId: string,
  type: 'like' | 'comment' | 'follow',
  title: string,
  message: string,
  fromUserId: string,
  relatedPostId?: string
): Promise<void> {
  try {
    // 不给自己发通知
    if (targetUserId === fromUserId) return;
    
    await createNotification({
      userId: targetUserId,
      type,
      title,
      message,
      read: false,
      relatedPostId,
      relatedUserId: fromUserId
    });
  } catch (error) {
    console.error('创建互动通知失败:', error);
    throw error;
  }
}

// 获取管理员发送的系统通知（简化版）
export async function getAdminSentNotifications(adminId: string, limitCount: number = 50): Promise<Notification[]> {
  try {
    // 分步查询以避免复杂索引
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('adminId', '==', adminId),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    
    // 去重，因为同一条通知会发给多个用户
    const uniqueNotifications = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === 'system') {  // 在客户端过滤
        const key = `${data.title}-${data.message}-${data.createdAt?.seconds}`;
        
        if (!uniqueNotifications.has(key)) {
          uniqueNotifications.set(key, {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
          } as Notification);
        }
      }
    });
    
    // 在客户端排序
    const notifications = Array.from(uniqueNotifications.values());
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('获取管理员通知失败:', error);
    throw error;
  }
}

// 删除特定管理员发送的所有相同通知（简化版）
export async function deleteAdminNotificationBatch(
  adminId: string, 
  title: string, 
  message: string,
  createdTime: Date
): Promise<void> {
  try {
    // 使用更简单的查询
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('adminId', '==', adminId),
      where('title', '==', title)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);
    
    // 批量删除匹配的通知
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const docTime = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
      
      // 检查消息和时间是否匹配
      if (data.message === message && 
          data.type === 'system' &&
          Math.abs(docTime.getTime() - createdTime.getTime()) < 60000) {
        batch.delete(doc.ref);
      }
    });
    
    await batch.commit();
    console.log('批量删除通知成功');
  } catch (error) {
    console.error('批量删除通知失败:', error);
    throw error;
  }
} 