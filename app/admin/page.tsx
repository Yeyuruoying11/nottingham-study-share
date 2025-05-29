"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, Settings, ArrowLeft, Crown, Database, Tag, MessageSquare, BarChart3, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { getAllPostsFromFirestore, getPostsByCategoryFromFirestore } from '@/lib/firestore-posts';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [categoryPosts, setCategoryPosts] = useState<Record<string, any[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!isAdminUser(user)) {
        router.push('/');
        return;
      }
    }
  }, [mounted, user, loading, router]);

  // 加载帖子数据进行调试
  const loadPostsData = async () => {
    try {
      setLoadingPosts(true);
      
      // 获取所有帖子
      const posts = await getAllPostsFromFirestore();
      setAllPosts(posts);
      
      // 测试各个分类的帖子
      const categories = ['生活', '美食', '学习', '旅行', '购物', '租房'];
      const categoryData: Record<string, any[]> = {};
      
      for (const category of categories) {
        const categoryPosts = await getPostsByCategoryFromFirestore(category);
        categoryData[category] = categoryPosts;
      }
      
      setCategoryPosts(categoryData);
      
    } catch (error) {
      console.error('加载帖子数据失败:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isAdminUser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您没有管理员权限</p>
          <Link href="/" className="text-green-600 hover:text-green-800">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: '用户管理',
      description: '管理用户账户和权限',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      available: false
    },
    {
      title: '内容审核',
      description: '审核和管理用户发布的内容',
      icon: MessageSquare,
      href: '/admin/content',
      color: 'bg-green-500',
      available: false
    },
    {
      title: '帖子管理',
      description: '管理和监控平台帖子',
      icon: FileText,
      href: '/admin/posts',
      color: 'bg-purple-500',
      available: false
    },
    {
      title: '通知管理',
      description: '发送系统通知给用户',
      icon: Bell,
      href: '/admin/notifications',
      color: 'bg-orange-500',
      available: true
    },
    {
      title: '数据统计',
      description: '查看平台使用统计数据',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-indigo-500',
      available: false
    },
    {
      title: '系统设置',
      description: '配置平台系统设置',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-xl font-semibold text-gray-900">管理员面板</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">欢迎，</span>
              <span className="text-sm font-medium text-green-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">管理功能</h2>
          <p className="text-gray-600">选择要管理的功能模块</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => {
            const Icon = feature.icon;
            
            if (feature.available) {
              return (
                <Link key={index} href={feature.href}>
                  <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-6 cursor-pointer group">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 ${feature.color} rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              );
            } else {
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-6 opacity-50 cursor-not-allowed">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 ${feature.color} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {feature.description}
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    即将推出
                  </span>
                </div>
              );
            }
          })}
        </div>

        {/* 快速统计 */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总用户数</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总帖子数</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日活跃</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待审核</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 帖子调试 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">帖子调试</h3>
          </div>
          <button
            onClick={() => {
              setShowDebug(!showDebug);
              if (!showDebug && allPosts.length === 0) {
                loadPostsData();
              }
            }}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors mb-2"
          >
            {showDebug ? '隐藏调试信息' : '显示调试信息'}
          </button>
          
          {/* 快速修复按钮 */}
          <button
            onClick={async () => {
              if (confirm('确定要修复所有帖子的分类吗？这将检查并修复分类字段。')) {
                try {
                  const { doc, updateDoc, getDocs, collection } = await import('firebase/firestore');
                  const { db } = await import('@/lib/firebase');
                  
                  const postsRef = collection(db, 'posts');
                  const snapshot = await getDocs(postsRef);
                  
                  let fixed = 0;
                  for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const currentCategory = data.category;
                    
                    // 检查分类是否需要修复
                    if (!currentCategory || currentCategory.trim() === '') {
                      await updateDoc(doc(db, 'posts', docSnap.id), {
                        category: '生活' // 默认分类
                      });
                      fixed++;
                    }
                  }
                  
                  alert(`修复完成！共修复了 ${fixed} 个帖子的分类。`);
                  if (showDebug) {
                    loadPostsData(); // 重新加载数据
                  }
                } catch (error) {
                  console.error('修复失败:', error);
                  alert('修复失败: ' + (error instanceof Error ? error.message : String(error)));
                }
              }
            }}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            快速修复分类
          </button>
        </motion.div>

        {/* 调试信息显示 */}
        {showDebug && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🔍 帖子分类调试信息</h2>
              
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">加载帖子数据中...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 统计信息 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">📊 统计信息</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{allPosts.length}</div>
                        <div className="text-sm text-gray-600">总帖子数</div>
                      </div>
                      {Object.entries(categoryPosts).map(([category, posts]) => (
                        <div key={category} className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">{posts.length}</div>
                          <div className="text-sm text-gray-600">{category}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 所有帖子详情 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">📝 所有帖子详情</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {allPosts.map((post, index) => (
                        <div key={post.id || index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{post.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Tag className="w-3 h-3" />
                                  <span>分类: <strong className="text-red-600">{post.category || '未设置'}</strong></span>
                                </span>
                                <span>作者: {post.author?.name || '未知'}</span>
                                <span>ID: {post.id}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                post.category === '美食' ? 'bg-red-100 text-red-800' :
                                post.category === '学习' ? 'bg-blue-100 text-blue-800' :
                                post.category === '生活' ? 'bg-green-100 text-green-800' :
                                post.category === '旅行' ? 'bg-purple-100 text-purple-800' :
                                post.category === '购物' ? 'bg-pink-100 text-pink-800' :
                                post.category === '租房' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {post.category || '未分类'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 分类查询测试 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">🔍 分类查询测试</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(categoryPosts).map(([category, posts]) => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {category} ({posts.length} 个帖子)
                          </h4>
                          {posts.length > 0 ? (
                            <div className="space-y-2">
                              {posts.map((post, index) => (
                                <div key={index} className="text-xs bg-green-50 p-2 rounded border">
                                  <strong>{post.title}</strong>
                                  <br />
                                  <span className="text-gray-600">分类: {post.category}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">该分类下没有找到帖子</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
} 