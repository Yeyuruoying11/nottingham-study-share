"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateConversation } from '@/lib/chat-service';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
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

  // 搜索用户
  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // 按用户名搜索
      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        limit(20)
      );

      const querySnapshot = await getDocs(usersQuery);
      const results: UserSearchResult[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // 排除当前用户
        if (doc.id !== user.uid) {
          results.push({
            id: doc.id,
            displayName: userData.displayName || userData.email,
            email: userData.email,
            avatar: userData.photoURL || userData.avatar
          });
        }
      });

      // 如果按用户名没找到足够结果，再按邮箱搜索
      if (results.length < 10 && query.includes('@')) {
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '>=', query),
          where('email', '<=', query + '\uf8ff'),
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
              avatar: userData.photoURL || userData.avatar
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
  }, [searchQuery, user]);

  // 发起聊天
  const handleStartChat = async (targetUser: UserSearchResult) => {
    if (!user || isCreatingChat) return;

    setIsCreatingChat(targetUser.id);
    try {
      const conversationId = await getOrCreateConversation(
        user.uid,
        targetUser.id,
        user.displayName || '用户',
        user.photoURL || '',
        targetUser.displayName,
        targetUser.avatar || ''
      );

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

          {/* 搜索框 */}
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户名或邮箱..."
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
                <User className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-center">输入用户名或邮箱开始搜索</p>
                <p className="text-sm text-gray-400 mt-2">找到感兴趣的同学一起聊天</p>
              </div>
            ) : searchResults.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-center">没有找到相关用户</p>
                <p className="text-sm text-gray-400 mt-2">试试其他关键词</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {user.displayName}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartChat(user)}
                      disabled={isCreatingChat === user.id}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCreatingChat === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
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