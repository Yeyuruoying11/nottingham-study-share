"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Tag, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { getAllPostsFromFirestore } from '@/lib/firestore-posts';

// 分类关键词映射
const CATEGORY_KEYWORDS = {
  '美食': ['美食', '餐厅', '吃', '食物', '菜', '饭', '面', '火锅', '烧烤', '甜品', '咖啡', '奶茶', '中餐', '西餐', '日料', '韩料', '泰餐', '印度菜', 'food', 'restaurant', 'eat', 'meal', 'dish', 'cuisine'],
  '学习': ['学习', '课程', '论文', '考试', '作业', '图书馆', '教授', '成绩', '学分', '毕业', '研究', '实验', '课堂', 'study', 'course', 'exam', 'assignment', 'library', 'professor', 'grade', 'research'],
  '生活': ['生活', '日常', '购物', '银行', '医院', '交通', '公交', '地铁', '打车', '超市', '生活用品', '手机', '网络', 'life', 'daily', 'shopping', 'bank', 'hospital', 'transport', 'supermarket'],
  '旅行': ['旅行', '旅游', '景点', '酒店', '机票', '火车', '自驾', '攻略', '风景', '拍照', '度假', 'travel', 'trip', 'hotel', 'flight', 'train', 'sightseeing', 'vacation'],
  '购物': ['购物', '商场', '打折', '优惠', '品牌', '衣服', '鞋子', '化妆品', '电子产品', '网购', 'shopping', 'mall', 'discount', 'brand', 'clothes', 'shoes', 'cosmetics'],
  '租房': ['租房', '房租', '房东', '合同', '押金', '水电', '网络', '家具', '室友', '搬家', 'rent', 'landlord', 'contract', 'deposit', 'utilities', 'furniture', 'roommate']
};

export default function AdminContentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixResults, setFixResults] = useState(null);

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
      
      loadPosts();
    }
  }, [mounted, user, loading, router]);

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const allPosts = await getAllPostsFromFirestore();
      setPosts(allPosts);
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // 智能分类检测
  const detectCategory = (post) => {
    const text = (post.title + ' ' + post.content + ' ' + (post.tags || []).join(' ')).toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return '生活'; // 默认分类
  };

  // 批量修复分类
  const fixCategories = async () => {
    if (!confirm('确定要批量修复帖子分类吗？这将根据帖子内容自动分配分类。')) {
      return;
    }

    setFixing(true);
    const results = {
      total: posts.length,
      fixed: 0,
      unchanged: 0,
      errors: 0,
      details: []
    };

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      for (const post of posts) {
        try {
          const detectedCategory = detectCategory(post);
          const currentCategory = post.category || '未分类';
          
          if (currentCategory !== detectedCategory) {
            // 更新帖子分类
            await updateDoc(doc(db, 'posts', post.id), {
              category: detectedCategory
            });
            
            results.fixed++;
            results.details.push({
              id: post.id,
              title: post.title,
              oldCategory: currentCategory,
              newCategory: detectedCategory,
              status: 'fixed'
            });
          } else {
            results.unchanged++;
            results.details.push({
              id: post.id,
              title: post.title,
              category: currentCategory,
              status: 'unchanged'
            });
          }
        } catch (error) {
          console.error(`修复帖子 ${post.id} 失败:`, error);
          results.errors++;
          results.details.push({
            id: post.id,
            title: post.title,
            error: error.message,
            status: 'error'
          });
        }
      }

      setFixResults(results);
      
      // 重新加载帖子
      await loadPosts();
      
    } catch (error) {
      console.error('批量修复失败:', error);
      alert('批量修复失败: ' + error.message);
    } finally {
      setFixing(false);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您没有管理员权限</p>
          <Link href="/" className="text-green-600 hover:text-green-800">返回首页</Link>
        </div>
      </div>
    );
  }

  // 统计分类信息
  const categoryStats = posts.reduce((acc, post) => {
    const category = post.category || '未分类';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-green-500" />
                <h1 className="text-xl font-semibold text-gray-900">内容管理</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 分类统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">帖子分类统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{count}</div>
                <div className="text-sm text-gray-600">{category}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 分类修复工具 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Tag className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">智能分类修复</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            系统将根据帖子标题、内容和标签自动检测并修复分类。支持中英文关键词识别。
          </p>
          
          <button
            onClick={fixCategories}
            disabled={fixing || loadingPosts}
            className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {fixing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>修复中...</span>
              </>
            ) : (
              <>
                <Tag className="w-5 h-5" />
                <span>开始智能分类修复</span>
              </>
            )}
          </button>
        </motion.div>

        {/* 修复结果 */}
        {fixResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">修复结果</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{fixResults.total}</div>
                <div className="text-sm text-gray-600">总帖子数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{fixResults.fixed}</div>
                <div className="text-sm text-gray-600">已修复</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{fixResults.unchanged}</div>
                <div className="text-sm text-gray-600">无需修改</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{fixResults.errors}</div>
                <div className="text-sm text-gray-600">错误</div>
              </div>
            </div>

            {/* 详细结果 */}
            <div className="max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-2">详细结果:</h3>
              <div className="space-y-2">
                {fixResults.details.map((detail, index) => (
                  <div key={index} className={`p-3 rounded-lg text-sm ${
                    detail.status === 'fixed' ? 'bg-green-50 border border-green-200' :
                    detail.status === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {detail.status === 'fixed' && <Check className="w-4 h-4 text-green-500" />}
                      {detail.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className="font-medium">{detail.title}</span>
                    </div>
                    {detail.status === 'fixed' && (
                      <p className="text-gray-600 mt-1">
                        {detail.oldCategory} → {detail.newCategory}
                      </p>
                    )}
                    {detail.status === 'unchanged' && (
                      <p className="text-gray-600 mt-1">分类: {detail.category}</p>
                    )}
                    {detail.status === 'error' && (
                      <p className="text-red-600 mt-1">错误: {detail.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 帖子列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">所有帖子</h2>
          
          {loadingPosts ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{post.content.substring(0, 100)}...</p>
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
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
} 