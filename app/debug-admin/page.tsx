"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser, ADMIN_CONFIG } from '@/lib/admin-config';
import { getAllPostsFromFirestore } from '@/lib/firestore-posts';
import { Crown, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDebugPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
      return;
    }
    
    if (mounted && user) {
      loadPosts();
    }
  }, [mounted, user, router]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await getAllPostsFromFirestore();
      setPosts(allPosts.slice(0, 5)); // 只显示前5个帖子
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = isAdminUser(user);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <span>管理员权限调试</span>
          </h1>
          <p className="text-gray-600">检查当前用户的管理员权限和删除功能状态</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 用户信息 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>当前用户信息</span>
            </h2>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">邮箱: </span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">显示名称: </span>
                <span className="text-gray-900">{user.displayName || '未设置'}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">UID: </span>
                <span className="text-gray-900 font-mono text-sm">{user.uid}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">管理员状态: </span>
                {isAdmin ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>是管理员</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span>不是管理员</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 管理员配置 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>管理员配置</span>
            </h2>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">管理员邮箱列表:</span>
                <ul className="mt-2 space-y-1">
                  {ADMIN_CONFIG.adminEmails.map((email, index) => (
                    <li key={index} className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">当前邮箱匹配: </span>
                {ADMIN_CONFIG.adminEmails.includes(user.email?.toLowerCase() || '') ? (
                  <span className="text-green-600">✅ 匹配</span>
                ) : (
                  <span className="text-red-600">❌ 不匹配</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 帖子删除权限测试 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <span>帖子删除权限测试</span>
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => {
                const isAuthor = user && post.author.uid && user.uid === post.author.uid;
                const canDelete = isAdmin || isAuthor;
                
                return (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          作者: {post.author.name} (UID: {post.author.uid || '无'})
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">是作者:</span>
                            {isAuthor ? (
                              <span className="text-green-600">✅ 是</span>
                            ) : (
                              <span className="text-red-600">❌ 否</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">可删除:</span>
                            {canDelete ? (
                              <span className="text-green-600">✅ 是</span>
                            ) : (
                              <span className="text-red-600">❌ 否</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {canDelete ? (
                          <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            有删除权限
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            无删除权限
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 解决方案 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 问题解决方案</h3>
          
          {!isAdmin ? (
            <div className="space-y-3 text-blue-800">
              <p>您当前不是管理员，如果需要管理员权限，请:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>确认您使用的是正确的管理员邮箱登录</li>
                <li>如果需要添加新的管理员邮箱，请修改 <code className="bg-blue-100 px-1 rounded">lib/admin-config.ts</code> 文件</li>
                <li>管理员可以删除任何帖子，包括其他用户的帖子</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 text-blue-800">
              <p>✅ 您是管理员！如果删除按钮仍然不显示，请:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>刷新页面重新加载权限</li>
                <li>检查浏览器控制台是否有错误</li>
                <li>在帖子卡片上悬停并点击三个点菜单</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 