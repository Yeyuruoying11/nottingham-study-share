"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Bell, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { sendSystemNotification } from '@/lib/firestore-notifications';
import { isAdminUser } from '@/lib/utils';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 检查管理员权限
  if (!user || !isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">访问被拒绝</h1>
          <p className="text-gray-600 mb-6">您没有权限访问此页面</p>
          <Link 
            href="/"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setErrorMessage('请填写完整的标题和内容');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await sendSystemNotification(title.trim(), message.trim(), user.uid);
      setSuccessMessage('系统通知发送成功！');
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('发送通知失败:', error);
      setErrorMessage('发送通知失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-900">通知管理</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">管理员：</span>
              <span className="text-sm font-medium text-blue-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 功能说明卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-start space-x-3">
              <Users className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">系统通知发送</h2>
                <p className="text-blue-700 text-sm leading-relaxed">
                  在这里可以向所有用户发送系统通知。通知将显示在用户的通知列表中，未读通知会在导航栏显示红点提示。
                  请确保通知内容准确、有用，避免发送垃圾信息。
                </p>
              </div>
            </div>
          </motion.div>

          {/* 发送通知表单 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <form onSubmit={handleSendNotification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearMessages();
                  }}
                  placeholder="输入通知标题，如：重要公告、系统维护通知等"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {title.length}/100
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知内容 *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearMessages();
                  }}
                  placeholder="输入详细的通知内容..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/500
                </div>
              </div>

              {/* 消息提示 */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">{successMessage}</span>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">{errorMessage}</span>
                </motion.div>
              )}

              {/* 发送按钮 */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setMessage('');
                    clearMessages();
                  }}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  清空内容
                </button>
                
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>发送中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>发送给所有用户</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* 注意事项 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-50 border border-orange-200 rounded-xl p-6"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">注意事项</h3>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• 系统通知将发送给所有注册用户</li>
                  <li>• 通知发送后无法撤回，请仔细检查内容</li>
                  <li>• 建议通知内容简洁明了，避免过于频繁发送</li>
                  <li>• 用户可以在通知页面查看和管理收到的通知</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 