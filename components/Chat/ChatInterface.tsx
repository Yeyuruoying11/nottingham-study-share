"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MoreVertical, Image as ImageIcon, Smile, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subscribeToConversationMessages, 
  sendMessage, 
  markMessagesAsRead,
  formatMessageTime,
  subscribeToUserOnlineStatus
} from '@/lib/chat-service';
import { ChatMessage, Conversation, UserOnlineStatus } from '@/lib/types';

interface ChatInterfaceProps {
  conversation: Conversation;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  onBack: () => void;
}

export default function ChatInterface({ conversation, otherUser, onBack }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState<UserOnlineStatus | null>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 检查是否是AI角色
  const isAIChat = otherUser.id.startsWith('ai_');
  const aiCharacterId = isAIChat ? otherUser.id.replace('ai_', '') : null;

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 实时监听消息
  useEffect(() => {
    if (!conversation.id) return;

    const unsubscribe = subscribeToConversationMessages(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
        // 标记消息为已读
        if (user) {
          markMessagesAsRead(conversation.id!, user.uid);
        }
      }
    );

    return () => unsubscribe();
  }, [conversation.id, user]);

  // 实时监听对方在线状态（仅真实用户）
  useEffect(() => {
    if (!otherUser.id || isAIChat) return;

    const unsubscribe = subscribeToUserOnlineStatus(
      otherUser.id,
      (status) => {
        setOtherUserStatus(status);
      }
    );

    return () => unsubscribe();
  }, [otherUser.id, isAIChat]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理AI响应
  const triggerAIResponse = async (messageId: string, userMessage: string) => {
    if (!aiCharacterId || !conversation.id) return;

    try {
      setIsAITyping(true);
      
      // 调用AI聊天响应API
      const response = await fetch('/api/ai/chat-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          messageId: messageId,
          userMessage: userMessage,
          aiCharacterId: aiCharacterId
        }),
      });

      if (!response.ok) {
        throw new Error('AI响应失败');
      }

      console.log('AI聊天任务已创建，等待响应...');
    } catch (error) {
      console.error('触发AI响应失败:', error);
    } finally {
      // AI会有延迟响应，所以我们设置一个最小的typing时间
      setTimeout(() => {
        setIsAITyping(false);
      }, 2000);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation.id || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const messageId = await sendMessage(
        conversation.id,
        user.uid,
        user.displayName || '用户',
        user.photoURL || '',
        content
      );

      // 如果是AI聊天，触发AI响应
      if (isAIChat && messageId) {
        await triggerAIResponse(messageId, content);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败，请重试');
      setNewMessage(content); // 恢复输入内容
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // 按 Enter 发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 检查消息是否是连续的（相同发送者）
  const isConsecutiveMessage = (message: ChatMessage, index: number) => {
    if (index === 0) return false;
    const prevMessage = messages[index - 1];
    return prevMessage.senderId === message.senderId && 
           message.timestamp.getTime() - prevMessage.timestamp.getTime() < 5 * 60 * 1000; // 5分钟内
  };

  // 渲染消息气泡
  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === user?.uid;
    const isConsecutive = isConsecutiveMessage(message, index);
    const showAvatar = !isOwnMessage && !isConsecutive;
    const showTime = index === messages.length - 1 || 
                    !isConsecutiveMessage(messages[index + 1], index + 1);
    const isAIMessage = (message as any).isAIMessage || (message as any).aiCharacterId;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div className={`flex items-end space-x-2 max-w-xs sm:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* 头像 */}
          {showAvatar && (
            <div className="relative">
              <img
                src={message.senderAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                alt={message.senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
              {isAIMessage && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-1.5 h-1.5 text-white" />
                </div>
              )}
            </div>
          )}
          
          {/* 占位符，保持对齐 */}
          {!showAvatar && !isOwnMessage && <div className="w-8"></div>}
          
          {/* 消息内容 */}
          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            {/* 发送者名称（仅对方消息且非连续消息时显示） */}
            {!isOwnMessage && !isConsecutive && (
              <div className="flex items-center space-x-1 mb-1 px-3">
                <span className="text-xs text-gray-500">
                  {message.senderName}
                </span>
                {isAIMessage && (
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">AI</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 消息气泡 */}
            <div
              className={`px-4 py-2 rounded-2xl break-words ${
                isOwnMessage
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : isAIMessage
                  ? 'bg-blue-50 text-gray-900 rounded-bl-sm border border-blue-200'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              } ${isConsecutive ? 'mt-1' : 'mt-0'}`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            
            {/* 时间戳 */}
            {showTime && (
              <span className="text-xs text-gray-400 mt-1 px-3">
                {formatMessageTime(message.timestamp)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // 渲染AI正在输入指示器
  const renderAITyping = () => {
    if (!isAITyping) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex justify-start mb-2"
      >
        <div className="flex items-end space-x-2 max-w-xs sm:max-w-md">
          <img
            src={otherUser.avatar || 'https://images.unsplash.com/photo-1635776062043-223faf322b1d?w=32&h=32&fit=crop&crop=face'}
            alt={otherUser.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl rounded-bl-sm">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-blue-600 ml-2">AI正在思考...</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={otherUser.avatar || (isAIChat ? 
                  'https://images.unsplash.com/photo-1635776062043-223faf322b1d?w=40&h=40&fit=crop&crop=face' :
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
                )}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {/* AI标识 */}
              {isAIChat && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {/* 在线状态指示器（仅真实用户） */}
              {!isAIChat && otherUserStatus?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                {isAIChat && (
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">AI助手</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isAIChat ? (
                  <span className="text-blue-600">24小时在线 • 智能助手</span>
                ) : otherUserStatus?.isOnline ? (
                  <span className="text-green-600">在线</span>
                ) : otherUserStatus?.lastSeen ? (
                  `最后活跃: ${formatMessageTime(otherUserStatus.lastSeen)}`
                ) : (
                  '离线'
                )}
              </p>
            </div>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isAIChat ? (
              <>
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg font-medium mb-2">开始与AI助手对话！</p>
                <p className="text-sm text-center">
                  {otherUser.name} 是您的智能助手，可以回答问题、提供建议和进行友好的对话
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2">开始你们的对话吧！</p>
                <p className="text-sm">发送第一条消息来打破沉默</p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => renderMessage(message, index))}
            {renderAITyping()}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end space-x-3">
          {/* 附加功能按钮 */}
          <div className="flex space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          {/* 消息输入框 */}
          <div className="flex-1 flex items-end space-x-3">
            <div className="flex-1 max-h-32 overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAIChat ? "向AI助手发送消息..." : "输入消息..."}
                className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                disabled={isSending}
              />
            </div>
            
            {/* 发送按钮 */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isAIChat
                  ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
              }`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 