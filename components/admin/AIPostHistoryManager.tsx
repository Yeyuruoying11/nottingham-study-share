"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Tag, 
  BarChart3, 
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { AICharacter } from '@/lib/types';
import { AIPostHistoryService, AIPostHistory, AIPostStats } from '@/lib/ai-post-history-service';

interface AIPostHistoryManagerProps {
  characters: AICharacter[];
}

export default function AIPostHistoryManager({ characters }: AIPostHistoryManagerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [postHistory, setPostHistory] = useState<AIPostHistory[]>([]);
  const [postStats, setPostStats] = useState<AIPostStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string>('');

  // 加载选中AI角色的历史记录
  const loadCharacterHistory = async (characterId: string) => {
    if (!characterId) return;
    
    setLoading(true);
    try {
      console.log('加载AI角色历史记录:', characterId);
      
      const [history, stats] = await Promise.all([
        AIPostHistoryService.getRecentPostHistory(characterId, 50),
        AIPostHistoryService.getCharacterPostStats(characterId)
      ]);
      
      setPostHistory(history);
      setPostStats(stats);
      console.log('历史记录加载完成:', history.length, '条记录');
      
    } catch (error) {
      console.error('加载AI角色历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 清理历史记录
  const cleanupHistory = async (characterId: string) => {
    if (!characterId) return;
    
    try {
      console.log('清理AI角色历史记录:', characterId);
      await AIPostHistoryService.cleanupOldHistory(characterId);
      
      // 重新加载数据
      await loadCharacterHistory(characterId);
      
      alert('历史记录清理完成！');
    } catch (error) {
      console.error('清理历史记录失败:', error);
      alert('清理失败，请稍后重试');
    }
  };

  // 格式化日期
  const formatDate = (date: Date | any) => {
    if (!date) return '-';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors = {
      '生活': 'bg-blue-100 text-blue-800',
      '学习': 'bg-green-100 text-green-800',
      '旅行': 'bg-purple-100 text-purple-800',
      '美食': 'bg-orange-100 text-orange-800',
      '资料': 'bg-gray-100 text-gray-800',
      '租房': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (selectedCharacter) {
      loadCharacterHistory(selectedCharacter);
    }
  }, [selectedCharacter]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            AI帖子历史管理
          </h2>
          
          {selectedCharacter && (
            <div className="flex space-x-3">
              <button
                onClick={() => loadCharacterHistory(selectedCharacter)}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              
              <button
                onClick={() => cleanupHistory(selectedCharacter)}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清理旧记录
              </button>
            </div>
          )}
        </div>

        {/* AI角色选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择AI角色
          </label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择AI角色</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.displayName} ({character.virtual_user?.profile?.major || '未设置专业'})
              </option>
            ))}
          </select>
        </div>

        {/* 统计信息 */}
        {postStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">总发帖数</p>
                  <p className="text-2xl font-bold">{postStats.total_posts}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">最活跃分类</p>
                  <p className="text-lg font-bold">
                    {Object.entries(postStats.posts_by_category)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || '-'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">关键词数量</p>
                  <p className="text-2xl font-bold">{postStats.recent_keywords.length}</p>
                </div>
                <Tag className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">最后发帖</p>
                  <p className="text-sm font-medium">
                    {postStats.last_post_date ? formatDate(postStats.last_post_date) : '暂无'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        )}

        {/* 分类统计图表 */}
        {postStats && Object.keys(postStats.posts_by_category).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">分类发帖统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(postStats.posts_by_category).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className={`inline-block px-3 py-2 rounded-lg ${getCategoryColor(category)} mb-2`}>
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 常用关键词 */}
        {postStats && postStats.recent_keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">常用关键词</h3>
            <div className="flex flex-wrap gap-2">
              {postStats.recent_keywords.slice(0, 20).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        )}

        {/* 历史记录列表 */}
        {!loading && postHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">发帖历史 ({postHistory.length}条)</h3>
            <div className="space-y-4">
              {postHistory.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(post.created_at)}
                        </span>
                        <span className={`px-2 py-1 rounded ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? '' : post.id || '')}
                      className="flex items-center px-3 py-1 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {expandedPost === post.id ? '收起' : '展开'}
                    </button>
                  </div>

                  {/* 展开的详细内容 */}
                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">内容摘要</h5>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                          {post.content_summary}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">标签</h5>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">关键词</h5>
                        <div className="flex flex-wrap gap-2">
                          {post.content_keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <a
                          href={`/post/${post.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          查看原帖 →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && selectedCharacter && postHistory.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">该AI角色暂无发帖历史</p>
          </div>
        )}

        {/* 未选择状态 */}
        {!selectedCharacter && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">请选择一个AI角色查看其发帖历史</p>
          </div>
        )}
      </div>
    </div>
  );
} 