"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  BookOpen, 
  ArrowLeft, 
  MessageCircle,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { 
  getOrCreateConversation,
  updateUserOnlineStatus,
  subscribeToUserOnlineStatus
} from '@/lib/chat-service';
import { UserOnlineStatus } from '@/lib/types';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  university: string;
  createdAt: Date;
  postsCount: number;
  likesCount: number;
  commentsCount: number;
}

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [userOnlineStatus, setUserOnlineStatus] = useState<UserOnlineStatus | null>(null);

  // 获取用户资料信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            uid: userId,
            displayName: userData.displayName || '未知用户',
            email: userData.email || '',
            photoURL: userData.photoURL,
            bio: userData.bio,
            university: userData.university || '诺丁汉大学',
            createdAt: userData.createdAt?.toDate() || new Date(),
            postsCount: userData.postsCount || 0,
            likesCount: userData.likesCount || 0,
            commentsCount: userData.commentsCount || 0
          });
        } else {
          setError('用户不存在');
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        setError('获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // 监听用户在线状态
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserOnlineStatus(
      userId,
      (status) => {
        setUserOnlineStatus(status);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // 发起聊天
  const handleStartChat = async () => {
    if (!currentUser || !userProfile || isStartingChat) return;

    if (currentUser.uid === userProfile.uid) {
      alert('不能与自己聊天');
      return;
    }

    setIsStartingChat(true);
    
    try {
      const conversationId = await getOrCreateConversation(
        currentUser.uid,
        userProfile.uid,
        currentUser.displayName || '用户',
        currentUser.photoURL || '',
        userProfile.displayName,
        userProfile.photoURL || ''
      );
      
      console.log('聊天会话创建成功:', conversationId);
      router.push('/chat');
    } catch (error) {
      console.error('发起聊天失败:', error);
      alert('发起聊天失败，请重试');
    } finally {
      setIsStartingChat(false);
    }
  };

  // 如果当前用户未登录
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录后才能查看用户资料</p>
          <Link 
            href="/login"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载用户资料中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || '用户不存在'}</h1>
          <p className="text-gray-600 mb-6">无法找到该用户的资料信息</p>
          <Link 
            href="/"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser.uid === userProfile.uid;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900">
              {isOwnProfile ? '我的资料' : '用户资料'}
            </h1>
            
            <div className="flex items-center space-x-2">
              {!isOwnProfile && (
                <>
                  {/* 发起聊天按钮 */}
                  <button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isStartingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>连接中...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>发起聊天</span>
                      </>
                    )}
                  </button>
                  
                  {/* 更多操作 */}
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {isOwnProfile && (
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span>编辑资料</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧 - 基本信息 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              {/* 头像和基本信息 */}
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt={userProfile.displayName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-green-600" />
                    )}
                  </div>
                  
                  {/* 在线状态指示器 */}
                  {userOnlineStatus && (
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                      userOnlineStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {userProfile.displayName}
                </h2>
                
                <p className="text-gray-500 text-sm mb-2">{userProfile.university}</p>
                
                {/* 在线状态文字 */}
                {userOnlineStatus && (
                  <p className="text-xs text-gray-500">
                    {userOnlineStatus.isOnline ? (
                      <span className="text-green-600">在线</span>
                    ) : (
                      `最后活跃: ${userOnlineStatus.lastSeen.toLocaleDateString('zh-CN')}`
                    )}
                  </p>
                )}
              </div>

              {/* 联系信息 */}
              <div className="space-y-4">
                {userProfile.email && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{userProfile.email}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    加入时间: {userProfile.createdAt.toLocaleDateString('zh-CN')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">英国诺丁汉</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">留学生</span>
                </div>
              </div>

              {/* 操作按钮 */}
              {!isOwnProfile && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isStartingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>连接中...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>发起聊天</span>
                      </>
                    )}
                  </button>
                  
                  <button className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <UserPlus className="w-4 h-4" />
                    <span>关注用户</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* 右侧 - 详细信息 */}
          <div className="lg:col-span-2">
            {/* 个人简介 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">个人简介</h3>
              <p className="text-gray-600 leading-relaxed">
                {userProfile.bio || '这个人很懒，什么都没有留下...'}
              </p>
            </motion.div>

            {/* 统计信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">数据统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userProfile.postsCount}</div>
                  <div className="text-sm text-gray-500">发布的攻略</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.likesCount}</div>
                  <div className="text-sm text-gray-500">获得的点赞</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userProfile.commentsCount}</div>
                  <div className="text-sm text-gray-500">收到的评论</div>
                </div>
              </div>
            </motion.div>

            {/* 最近发布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近发布</h3>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>还没有发布任何内容</p>
                <p className="text-sm">期待 TA 的精彩分享！</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 