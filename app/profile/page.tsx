"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Settings, Mail, Calendar, MapPin, BookOpen, ArrowLeft, Eye, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getUserPostsFromFirestore, FirestorePost, formatTimestamp } from '@/lib/firestore-posts';
import { Pagination } from '@/components/ui/Pagination';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [firestoreUserName, setFirestoreUserName] = useState<string>('');
  const [firestoreUserAvatar, setFirestoreUserAvatar] = useState<string>('');
  const [loadingUserName, setLoadingUserName] = useState(true);
  const [userPosts, setUserPosts] = useState<FirestorePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(3);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理用户认证状态
  useEffect(() => {
    if (mounted && !loading && !user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
    }
  }, [mounted, user, loading, router]);

  // 从Firestore获取用户名和头像
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoadingUserName(true);
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFirestoreUserName(userData.displayName || '未设置姓名');
        setFirestoreUserAvatar(userData.photoURL || user.photoURL || '');
      } else {
        setFirestoreUserName('未设置姓名');
        setFirestoreUserAvatar(user.photoURL || '');
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setFirestoreUserName(user.displayName || '未设置姓名');
      setFirestoreUserAvatar(user.photoURL || '');
    } finally {
      setLoadingUserName(false);
    }
  };

  // 获取用户发布的帖子
  const fetchUserPosts = async () => {
    if (!user) return;
    
    try {
      setLoadingPosts(true);
      console.log('🔍 开始获取用户帖子, 用户ID:', user.uid);
      console.log('🔍 用户邮箱:', user.email);
      console.log('🔍 用户显示名:', user.displayName);
      
      const posts = await getUserPostsFromFirestore(user.uid);
      console.log('📊 获取到的帖子数量:', posts.length);
      console.log('📝 帖子详情:', posts);
      
      // 检查帖子中的author.uid
      posts.forEach((post, index) => {
        console.log(`📝 帖子 ${index + 1}:`, {
          id: post.id,
          title: post.title,
          authorName: post.author.name,
          authorUid: post.author.uid,
          matches: post.author.uid === user.uid
        });
      });
      
      setUserPosts(posts);
      setCurrentPage(1); // 重置到第一页
    } catch (error) {
      console.error('❌ 获取用户帖子失败:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserPosts();
      
      // 监听用户资料更新事件
      const handleProfileUpdate = (event: CustomEvent) => {
        if (event.detail.uid === user.uid) {
          console.log('个人资料页面收到用户资料更新事件:', event.detail.profile);
          const profile = event.detail.profile;
          setFirestoreUserName(profile.displayName);
          setFirestoreUserAvatar(profile.photoURL);
      }
    };

      // 监听头像更新事件
      const handleAvatarUpdate = (event: CustomEvent) => {
        if (event.detail.uid === user.uid) {
          console.log('个人资料页面收到头像更新事件:', event.detail.newAvatarUrl);
          setFirestoreUserAvatar(event.detail.newAvatarUrl);
        }
    };

      // 监听用户名更新事件（保持兼容性）
      const handleUsernameUpdate = (event: CustomEvent) => {
        if (event.detail.uid === user.uid) {
          console.log('个人资料页面收到用户名更新事件:', event.detail.newUsername);
          setFirestoreUserName(event.detail.newUsername);
      }
    };

      // 监听帖子更新事件
      const handlePostUpdate = () => {
        console.log('个人资料页面收到帖子更新事件，重新加载用户帖子');
        fetchUserPosts();
      };

      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      window.addEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
      window.addEventListener('postUpdated', handlePostUpdate);
    
    return () => {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
        window.removeEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
        window.removeEventListener('postUpdated', handlePostUpdate);
    };
    }
  }, [user]);

  // 计算分页数据
  const totalPages = Math.ceil(userPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = userPosts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理帖子点击
  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  // 如果组件未挂载或正在加载，显示加载状态
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 如果用户未登录，显示空白页面（避免闪烁）
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">正在跳转到登录页面...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">个人资料</h1>
            <Link
              href="/settings"
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </Link>
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
              {/* 头像 */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  {firestoreUserAvatar ? (
                    <img 
                      src={firestoreUserAvatar} 
                      alt={user.displayName || user.email || "用户"} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-green-600" />
                  )}
                </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                      {loadingUserName ? (
                        <span className="text-gray-400">加载中...</span>
                      ) : (
                        firestoreUserName
                      )}
                  </h2>
                <p className="text-gray-500 text-sm mt-1">诺丁汉大学学生</p>
              </div>

              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    加入时间: {user.metadata.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString('zh-CN') : 
                      '未知'
                    }
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
            </motion.div>
          </div>

          {/* 右侧 - 详细信息 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">个人简介</h3>
                <p className="text-gray-600 leading-relaxed">
                这个人很懒，什么都没有留下...
                </p>
            </motion.div>

            {/* 统计信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6 mt-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">我的数据</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userPosts.length}</div>
                  <div className="text-sm text-gray-500">发布的攻略</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userPosts.reduce((total, post) => total + (post.likes || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">获得的点赞</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userPosts.reduce((total, post) => total + (post.comments || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">收到的评论</div>
                </div>
              </div>
            </motion.div>

            {/* 最近活动 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border p-6 mt-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
              
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : userPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>还没有任何活动记录</p>
                <p className="text-sm">快去分享你的第一个留学攻略吧！</p>
              </div>
              ) : (
                <div className="space-y-4">
                  {/* 帖子列表 */}
                  {currentPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handlePostClick(post.id!)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-green-200"
                    >
                      <div className="flex items-start space-x-4">
                        {/* 帖子图片 */}
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={post.image || post.images?.[0] || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop"}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop";
                            }}
                          />
                        </div>
                        
                        {/* 帖子信息 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          
                          {/* 标签 */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-xs text-gray-400">+{post.tags.length - 2}</span>
                            )}
                          </div>
                          
                          {/* 统计信息和时间 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>查看</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{post.likes || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{post.comments || 0}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(post.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* 分页控制 */}
                  {totalPages > 1 && (
                    <div className="pt-4 border-t">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        className="justify-center"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 