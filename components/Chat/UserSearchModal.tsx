"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, User, Loader2, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateConversation } from '@/lib/chat-service';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isAI?: boolean;
  description?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

export default function UserSearchModal({ isOpen, onClose, onChatCreated }: UserSearchModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'ai'>('all');

  // 搜索用户和AI角色
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results: UserSearchResult[] = [];

      // 搜索真实用户
      if (activeTab === 'all' || activeTab === 'users') {
        const usersQuery = query(
          collection(db, 'users'),
          where('displayName', '>=', searchTerm),
          where('displayName', '<=', searchTerm + '\uf8ff'),
          limit(15)
        );

        const querySnapshot = await getDocs(usersQuery);

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // 排除当前用户
          if (doc.id !== user.uid) {
            results.push({
              id: doc.id,
              displayName: userData.displayName || userData.email,
              email: userData.email,
              avatar: userData.photoURL || userData.avatar,
              isAI: false
            });
          }
        });

        // 如果按用户名没找到足够结果，再按邮箱搜索
        if (results.length < 10 && searchTerm.includes('@')) {
          const emailQuery = query(
            collection(db, 'users'),
            where('email', '>=', searchTerm),
            where('email', '<=', searchTerm + '\uf8ff'),
            limit(10)
          );

          const emailSnapshot = await getDocs(emailQuery);
          emailSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (doc.id !== user.uid && !results.find(r => r.id === doc.id)) {
              results.push({
                id: doc.id,
                displayName: userData.displayName || userData.email,
                email: userData.email,
                avatar: userData.photoURL || userData.avatar,
                isAI: false
              });
            }
          });
        }
      }

      // 搜索AI角色
      if (activeTab === 'all' || activeTab === 'ai') {
        const aiQuery = query(
          collection(db, 'ai_characters'),
          where('status', '==', 'active'),
          limit(10)
        );

        const aiSnapshot = await getDocs(aiQuery);
        aiSnapshot.forEach((doc) => {
          const aiData = doc.data();
          // 检查AI角色名称或描述是否匹配搜索词
          const displayName = aiData.displayName || '';
          const description = aiData.description || '';
          
          if (displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              description.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              id: doc.id,
              displayName: displayName,
              email: aiData.virtual_user?.email || `${aiData.name}@nottingham.ai`,
              avatar: aiData.avatar,
              isAI: true,
              description: description
            });
          }
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('搜索用户失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 防抖搜索
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user, activeTab]);

  // 发起聊天
  const handleStartChat = async (targetUser: UserSearchResult) => {
    if (!user || isCreatingChat) return;

    setIsCreatingChat(targetUser.id);
    try {
      let conversationId;
      
      if (targetUser.isAI) {
        // 与AI角色聊天，使用AI的虚拟用户ID
        conversationId = await getOrCreateConversation(
          user.uid,
          `ai_${targetUser.id}`, // AI角色的虚拟用户ID
          user.displayName || '用户',
          user.photoURL || '',
          targetUser.displayName,
          targetUser.avatar || ''
        );
      } else {
        // 与真实用户聊天
        conversationId = await getOrCreateConversation(
          user.uid,
          targetUser.id,
          user.displayName || '用户',
          user.photoURL || '',
          targetUser.displayName,
          targetUser.avatar || ''
        );
      }

      onChatCreated(conversationId);
      onClose();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('创建聊天失败:', error);
      alert('创建聊天失败，请重试');
    } finally {
      setIsCreatingChat(null);
    }
  };

  // 筛选结果
  const filteredResults = searchResults.filter(result => {
    if (activeTab === 'users') return !result.isAI;
    if (activeTab === 'ai') return result.isAI;
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">发起新聊天</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 标签切换 */}
          <div className="flex space-x-1 p-4 bg-gray-50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              同学
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI助手
            </button>
          </div>

          {/* 搜索框 */}
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'ai' ? '搜索AI助手...' :
                  activeTab === 'users' ? '搜索用户名或邮箱...' :
                  '搜索用户或AI助手...'
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="flex-1 overflow-y-auto">
            {!searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                {activeTab === 'ai' ? (
                  <>
                    <Bot className="w-12 h-12 text-blue-300 mb-4" />
                    <p className="text-center">搜索AI助手开始智能对话</p>
                    <p className="text-sm text-gray-400 mt-2">AI助手24小时在线，随时为您答疑解惑</p>
                  </>
                ) : (
                  <>
                    <User className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-center">输入姓名或邮箱开始搜索</p>
                    <p className="text-sm text-gray-400 mt-2">找到感兴趣的同学一起聊天</p>
                  </>
                )}
              </div>
            ) : filteredResults.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-center">没有找到相关结果</p>
                <p className="text-sm text-gray-400 mt-2">试试其他关键词</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <img
                          src={result.avatar || (result.isAI ? 
                            'https://images.unsplash.com/photo-1635776062043-223faf322b1d?w=40&h=40&fit=crop&crop=face' :
                            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
                          )}
                          alt={result.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {result.isAI && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Bot className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {result.displayName}
                          </h4>
                          {result.isAI && (
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">AI</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {result.isAI ? result.description : result.email}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartChat(result)}
                      disabled={isCreatingChat === result.id}
                      className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        result.isAI 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {isCreatingChat === result.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : result.isAI ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">聊天</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 