"use client";

import React, { useState, useEffect } from 'react';
import { getAllPostsFromFirestore, getPostsByCategoryFromFirestore } from '@/lib/firestore-posts';

export default function DebugCategoriesPage() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [categoryPosts, setCategoryPosts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugLogs([]);
        
        addLog('开始加载数据...');
        
        // 获取所有帖子
        addLog('正在获取所有帖子...');
        const posts = await getAllPostsFromFirestore();
        addLog(`获取到 ${posts.length} 个帖子`);
        setAllPosts(posts);
        
        // 测试各个分类
        const categories = ['生活', '美食', '学习', '旅行', '购物', '租房'];
        const categoryData: Record<string, any[]> = {};
        
        for (const category of categories) {
          try {
            addLog(`正在查询分类: ${category}`);
            const catPosts = await getPostsByCategoryFromFirestore(category);
            addLog(`分类 ${category} 返回 ${catPosts.length} 个帖子`);
            categoryData[category] = catPosts;
          } catch (err) {
            const errorMsg = `获取${category}分类失败: ${err instanceof Error ? err.message : String(err)}`;
            addLog(errorMsg);
            console.error(errorMsg, err);
            categoryData[category] = [];
          }
        }
        
        setCategoryPosts(categoryData);
        addLog('数据加载完成');
        
      } catch (err) {
        const errorMsg = `加载数据失败: ${err instanceof Error ? err.message : String(err)}`;
        addLog(errorMsg);
        console.error('加载数据失败:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">错误</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <pre className="text-sm text-red-800">{error}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 分类调试页面</h1>
        
        {/* 调试日志 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 调试日志</h2>
          <div className="bg-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
        
        {/* 总览 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 总览</h2>
          <p className="text-lg">总帖子数: <strong>{allPosts.length}</strong></p>
        </div>

        {/* 所有帖子 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📝 所有帖子</h2>
          <div className="space-y-3">
            {allPosts.map((post, index) => (
              <div key={post.id || index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  分类: <span className="font-medium text-blue-600">{post.category || '未设置'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {post.id} | 作者: {post.author?.name || '未知'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 分类测试 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">🏷️ 分类查询测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryPosts).map(([category, posts]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">
                  {category} ({posts.length})
                </h3>
                {posts.length > 0 ? (
                  <div className="space-y-2">
                    {posts.map((post, index) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        <p className="font-medium">{post.title}</p>
                        <p className="text-xs text-gray-500">分类: {post.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">没有帖子</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 原始数据 */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            查看原始数据
          </summary>
          <div className="mt-4 bg-gray-100 rounded-lg p-4 overflow-auto">
            <pre className="text-xs">{JSON.stringify({ allPosts, categoryPosts }, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
} 