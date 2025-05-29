import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList: Notification[] = [];
        let unreadCounter = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification: Notification = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
          } as Notification;

          notificationsList.push(notification);
          
          if (!notification.read) {
            unreadCounter++;
          }
        });

        setNotifications(notificationsList);
        setUnreadCount(unreadCounter);
        setLoading(false);
      },
      (error) => {
        console.error('监听通知失败:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading
  };
}

// 简化版本的Hook，只返回未读数量
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error('监听未读通知数量失败:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return unreadCount;
} 