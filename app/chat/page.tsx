"use client";

import React, { useState, useEffect, Suspense } from 'react';
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
  getUserConversations,
  deleteConversation
} from '@/lib/chat-service';
import { Conversation } from '@/lib/types';
import ChatInterface from '@/components/Chat/ChatInterface';
import UserSearchModal from '@/components/Chat/UserSearchModal';

// 单独的组件来处理搜索参数
function ChatPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationIdFromUrl = searchParams.get('conversationId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setLoading(false);
        setIndexBuilding(false); // 如果成功获取数据，说明索引可用
        
        // 如果 URL 中有会话 ID，自动选择该会话
        if (conversationIdFromUrl) {
          const targetConversation = newConversations.find(c => c.id === conversationIdFromUrl);
          if (targetConversation) {
            setSelectedConversation(targetConversation);
            // 更新 URL 以保持会话选择状态
            router.replace(`/chat?conversationId=${conversationIdFromUrl}`, { scroll: false });
          }
        }
      }
    );

    // 设置超时，防止永久加载
    const timeout = setTimeout(() => {
      console.log('加载超时，停止加载状态');
      setLoading(false);
      
      // 如果超时后还是没有数据，可能是索引构建问题
      if (conversations.length === 0) {
        console.log('检测到可能的索引构建问题');
        setIndexBuilding(true);
      }
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
  }, [user, conversationIdFromUrl]); // 移除 selectedConversation 依赖

  // 点击外部关闭删除菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.delete-menu-container')) {
        setShowDeleteMenu(null);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDeleteMenu]);

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

  // 处理删除会话
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !window.confirm('确定要删除这个聊天吗？删除后无法恢复。')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId, user.uid);
      // 删除成功后，从列表中移除
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setShowDeleteMenu(null);
    } catch (error) {
      console.error('删除会话失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  // 筛选会话
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery || !user) return true;
    const otherUser = getOtherParticipant(conversation, user.uid);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 如果选中了会话，显示聊天界面
  if (selectedConversation && user) {
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
    if (!user) return null;
    
    const otherUser = getOtherParticipant(conversation, user.uid);
    if (!otherUser) return null;

    const unreadCount = conversation.unreadCount?.[user.uid] || 0;
    const isUnread = unreadCount > 0;
    const isDeleting = deletingId === conversation.id;

    return (
      <motion.div
        key={conversation.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={() => !isDeleting && setSelectedConversation(conversation)}
        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors group ${
          isDeleting ? 'opacity-50 pointer-events-none' : ''
        }`}
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
        <div className="relative delete-menu-container">
        <button
          onClick={(e) => {
            e.stopPropagation();
              setShowDeleteMenu(showDeleteMenu === conversation.id ? null : (conversation.id || null));
          }}
            className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full ml-2 transition-colors ${
              showDeleteMenu === conversation.id || isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

          {/* 删除菜单 */}
          {showDeleteMenu === conversation.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (conversation.id) {
                    handleDeleteConversation(conversation.id);
                  }
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <span>{isDeleting ? '删除中...' : '删除聊天'}</span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
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
          {/* 索引构建状态提示 */}
          {indexBuilding && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 mx-4 mt-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">数据库索引构建中</h4>
                  <p className="text-xs text-yellow-600 mt-1">
                    聊天功能正在初始化，这通常需要几分钟时间。请稍后再试。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">加载聊天记录中...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {indexBuilding ? (
                <>
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">系统准备中</h3>
                  <p className="text-yellow-600 text-center mb-6">
                    聊天功能正在初始化数据库索引，请稍等几分钟后刷新页面重试
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors"
                  >
                    刷新页面
                  </button>
                </>
              ) : searchQuery ? (
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

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载聊天页面中...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
} 