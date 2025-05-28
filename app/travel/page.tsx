"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle, User } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import TravelMap from '@/components/Map/TravelMap';
import { getPostsByCategoryFromFirestore } from '@/lib/firestore-posts';
import { Post } from '@/lib/types';

interface TravelPost extends Post {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    country?: string;
    city?: string;
  };
}

export default function TravelPage() {
  const router = useRouter();
  const [travelPosts, setTravelPosts] = useState<TravelPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<TravelPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'both'>('both');

  // 加载旅行帖子
  useEffect(() => {
    const loadTravelPosts = async () => {
      try {
        setLoading(true);
        const posts = await getPostsByCategoryFromFirestore('旅行');
        setTravelPosts(posts as TravelPost[]);
      } catch (error) {
        console.error('加载旅行帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTravelPosts();
  }, []);

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post as TravelPost);
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date && typeof date === 'object' && 'toDate' in date) {
      dateObj = date.toDate();
    } else {
      return '';
    }
    
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载旅行地图...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回首页</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">✈️ 旅行分享地图</h1>
              <p className="text-xs text-gray-500">发现同学们的精彩旅程</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  viewMode === 'map' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                地图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                列表
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  viewMode === 'both' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                混合
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 统计信息 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{travelPosts.length}</div>
              <div className="text-sm text-gray-600">旅行分享</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {travelPosts.filter(p => p.location).length}
              </div>
              <div className="text-sm text-gray-600">地图标记</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(travelPosts.filter(p => p.location).map(p => p.location?.country)).size}
              </div>
              <div className="text-sm text-gray-600">目的地国家</div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(viewMode === 'map' || viewMode === 'both') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 ${viewMode === 'both' ? 'h-96' : 'h-[calc(100vh-300px)]'}`}
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">🗺️ 旅行足迹地图</h2>
                <p className="text-sm text-gray-600">点击地图上的标记查看旅行分享</p>
              </div>
              <TravelMap
                onPostSelect={handlePostSelect}
                selectedPostId={selectedPost?.id}
                className="h-full"
              />
            </div>
          </motion.div>
        )}

        {(viewMode === 'list' || viewMode === 'both') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: viewMode === 'both' ? 0.2 : 0 }}
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">📝 旅行分享列表</h2>
                <p className="text-sm text-gray-600">浏览所有同学的旅行经历</p>
              </div>
              
              {travelPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">✈️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有旅行分享</h3>
                  <p className="text-gray-600 mb-4">成为第一个分享旅行经历的人吧！</p>
                  <Link
                    href="/create"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <span>分享我的旅行</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {travelPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedPost?.id === post.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                      }`}
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      <div className="flex space-x-4">
                        {/* 图片 */}
                        {post.images && post.images[0] && (
                          <div className="flex-shrink-0">
                            <img
                              src={post.images[0]}
                              alt={post.title}
                              className="w-24 h-24 object-cover rounded-xl"
                            />
                          </div>
                        )}
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {post.title}
                              </h3>
                              
                              {/* 位置信息 */}
                              {post.location && (
                                <div className="flex items-center space-x-1 text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span className="text-sm">{post.location.address}</span>
                                </div>
                              )}
                              
                              <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                                {post.content}
                              </p>
                              
                              {/* 标签 */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {post.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{post.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 底部信息 */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{post.author.displayName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(post.createdAt)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 浮动操作按钮 */}
        <Link
          href="/create"
          className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </main>
    </div>
  );
} 