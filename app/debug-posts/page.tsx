"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Tag, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPostsFromFirestore, getPostsByCategoryFromFirestore } from '@/lib/firestore-posts';

export default function DebugPostsPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [categoryPosts, setCategoryPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('生活');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取所有帖子
        const posts = await getAllPostsFromFirestore();
        setAllPosts(posts);
        
        // 测试各个分类的帖子
        const categories = ['生活', '美食', '学习', '旅行', '购物', '租房'];
        const categoryData = {};
        
        for (const category of categories) {
          const categoryPosts = await getPostsByCategoryFromFirestore(category);
          categoryData[category] = categoryPosts;
        }
        
        setCategoryPosts(categoryData);
        
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link href="/login" className="text-green-600 hover:text-green-800">去登录</Link>
        </div>
      </div>
    );
  }

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
                <Database className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-900">帖子数据调试</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 所有帖子概览 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">所有帖子 ({allPosts.length})</h2>
              <div className="space-y-3">
                {allPosts.map((post, index) => (
                  <div key={post.id || index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{post.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>分类: {post.category || '未设置'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>作者: {post.author?.name || '未知'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>ID: {post.id}</span>
                          </span>
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
            </motion.div>

            {/* 分类测试 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">分类查询测试</h2>
              
              {/* 分类选择 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['生活', '美食', '学习', '旅行', '购物', '租房'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({categoryPosts[category]?.length || 0})
                  </button>
                ))}
              </div>

              {/* 选中分类的帖子 */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  "{selectedCategory}" 分类的帖子 ({categoryPosts[selectedCategory]?.length || 0})
                </h3>
                
                {categoryPosts[selectedCategory]?.length > 0 ? (
                  <div className="space-y-3">
                    {categoryPosts[selectedCategory].map((post, index) => (
                      <div key={post.id || index} className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{post.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>分类: {post.category}</span>
                              <span>作者: {post.author?.name}</span>
                              <span>ID: {post.id}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            ✓ 匹配
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>该分类下没有找到帖子</p>
                    <p className="text-sm mt-1">这可能是分类字段不匹配导致的</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 数据库查询调试 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">数据库查询调试</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">分类统计</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(categoryPosts).map(([category, posts]) => (
                      <div key={category} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{posts.length}</div>
                        <div className="text-sm text-gray-600">{category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">查询信息</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p><strong>getAllPostsFromFirestore():</strong> 返回 {allPosts.length} 个帖子</p>
                    <p><strong>getPostsByCategoryFromFirestore('{selectedCategory}'):</strong> 返回 {categoryPosts[selectedCategory]?.length || 0} 个帖子</p>
                    <p className="mt-2 text-gray-600">
                      如果分类查询返回0但总数大于0，说明分类字段可能有问题
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
} 