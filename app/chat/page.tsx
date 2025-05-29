"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageCircle, ArrowLeft, Users, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  subscribeToUserConversations, 
  getOtherParticipant, 
  formatMessageTime,
  updateUserOnlineStatus,
  getUserConversations
} from '@/lib/chat-service';
import { Conversation } from '@/lib/types';
import ChatInterface from '@/components/Chat/ChatInterface';
import UserSearchModal from '@/components/Chat/UserSearchModal';

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationIdFromUrl = searchParams.get('conversationId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // 监听用户会话
  useEffect(() => {
    if (!user) return;

    // 更新用户在线状态
    updateUserOnlineStatus(user.uid, true);

    const unsubscribe = subscribeToUserConversations(
      user.uid,
      (newConversations) => {
        console.log('收到会话更新:', newConversations);
        setConversations(newConversations);
        setLoading(false); // 确保在任何情况下都停止加载
        
        // 如果 URL 中有会话 ID，自动选择该会话
        if (conversationIdFromUrl && !selectedConversation) {
          const targetConversation = newConversations.find(c => c.id === conversationIdFromUrl);
          if (targetConversation) {
            setSelectedConversation(targetConversation);
          }
        }
      }
    );

    // 设置超时，防止永久加载
    const timeout = setTimeout(() => {
      console.log('加载超时，停止加载状态');
      setLoading(false);
    }, 10000); // 10秒超时

    // 页面离开时更新为离线状态
    const handleBeforeUnload = () => {
      updateUserOnlineStatus(user.uid, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserOnlineStatus(user.uid, false);
    };
  }, [user, conversationIdFromUrl, selectedConversation]);

  // 处理聊天创建完成
  const handleChatCreated = async (conversationId: string) => {
    try {
      // 重新获取会话列表以找到新创建的会话
      if (user) {
        const updatedConversations = await getUserConversations(user.uid);
        setConversations(updatedConversations);
        
        // 自动选择新创建的会话
        const newConversation = updatedConversations.find(c => c.id === conversationId);
        if (newConversation) {
          setSelectedConversation(newConversation);
        }
      }
    } catch (error) {
      console.error('获取更新后的会话列表失败:', error);
    }
  };

  // 如果未登录，显示登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录后才能使用聊天功能</p>
          <Link 
            href="/login"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  // 筛选会话
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const otherUser = getOtherParticipant(conversation, user.uid);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 如果选中了会话，显示聊天界面
  if (selectedConversation) {
    const otherUser = getOtherParticipant(selectedConversation, user.uid);
    if (!otherUser) {
      setSelectedConversation(null);
      return null;
    }

    return (
      <div className="h-screen bg-white">
        <ChatInterface
          conversation={selectedConversation}
          otherUser={otherUser}
          onBack={() => {
            setSelectedConversation(null);
            // 清除 URL 参数
            router.push('/chat');
          }}
        />
      </div>
    );
  }

  // 渲染会话项
  const renderConversationItem = (conversation: Conversation) => {
    const otherUser = getOtherParticipant(conversation, user.uid);
    if (!otherUser) return null;

    const unreadCount = conversation.unreadCount?.[user.uid] || 0;
    const isUnread = unreadCount > 0;

    return (
      <motion.div
        key={conversation.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={() => setSelectedConversation(conversation)}
        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors group"
      >
        {/* 头像 */}
        <div className="relative mr-3">
          <img
            src={otherUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face'}
            alt={otherUser.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {/* 未读消息指示器 */}
          {isUnread && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        {/* 会话信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium truncate ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
              {otherUser.name}
            </h3>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatMessageTime(conversation.lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          {conversation.lastMessage ? (
            <p className={`text-sm truncate mt-1 ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {conversation.lastMessage.senderId === user.uid ? '我: ' : ''}
              {conversation.lastMessage.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">还没有消息</p>
          )}
        </div>

        {/* 更多选项按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // 这里可以添加更多选项的处理逻辑
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full ml-2 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <motion.header
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm border-b sticky top-0 z-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">返回</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <h1 className="text-xl font-bold text-gray-900">聊天</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="发起新聊天"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* 搜索栏 */}
        <div className="p-4 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索聊天记录..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 聊天列表 */}
        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">加载聊天记录中...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关聊天</h3>
                  <p className="text-gray-500 text-center mb-6">
                    尝试搜索其他关键词或清除搜索条件
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    清除搜索
                  </button>
                </>
              ) : (
                <>
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有聊天记录</h3>
                  <p className="text-gray-500 text-center mb-6">
                    开始与其他同学聊天，分享你的想法和经验
                  </p>
                  <button
                    onClick={() => setShowUserSearch(true)}
                    className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>发起新聊天</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredConversations.map(renderConversationItem)}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* 用户搜索模态框 */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
} 