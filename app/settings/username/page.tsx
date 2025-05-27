"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Clock, History, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  checkUsernameChangeStatus,
  changeUsername,
  getUsernameHistory,
  validateUsername,
  formatTimeUntilNextChange,
  type UsernameStatus,
  type UsernameChangeResult
} from '@/lib/username-service';

export default function UsernameSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [newUsername, setNewUsername] = useState('');
  const [status, setStatus] = useState<UsernameStatus | null>(null);
  const [history, setHistory] = useState<{
    current: string;
    history: string[];
    changeCount: number;
    lastChange?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [validationError, setValidationError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
      return;
    }
    
    if (mounted && user) {
      loadUserData();
    }
  }, [mounted, user, router]);

  const loadUserData = async () => {
    if (!user) {
      console.log('loadUserData: 用户不存在');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('loadUserData: 开始加载用户数据，UID:', user.uid);
      
      // 先尝试简单的状态检查
      console.log('loadUserData: 检查用户名状态...');
      const statusData = await checkUsernameChangeStatus(user.uid);
      console.log('loadUserData: 状态数据:', statusData);
      setStatus(statusData);
      
      // 再获取历史数据
      console.log('loadUserData: 获取用户名历史...');
      const historyData = await getUsernameHistory(user.uid);
      console.log('loadUserData: 历史数据:', historyData);
      setHistory(historyData);
      
      // 设置初始用户名
      setNewUsername(historyData.current || user.displayName || '');
      
      console.log('loadUserData: 数据加载完成');
      
    } catch (error: any) {
      console.error('loadUserData: 加载失败:', error);
      setError(`加载失败: ${error.message}`);
      
      // 如果是用户不存在的错误，尝试创建用户文档
      if (error.message.includes('用户不存在')) {
        console.log('loadUserData: 尝试创建用户文档...');
        try {
          const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '未设置姓名',
            university: "诺丁汉大学",
            usernameChangeCount: 0,
            usernameHistory: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          console.log('loadUserData: 用户文档创建成功，重新加载...');
          // 重新加载数据
          setTimeout(() => loadUserData(), 1000);
          return;
        } catch (createError) {
          console.error('loadUserData: 创建用户文档失败:', createError);
          setError(`创建用户文档失败: ${createError.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setNewUsername(value);
    
    // 实时验证
    if (value.trim()) {
      const validation = validateUsername(value);
      setValidationError(validation.valid ? '' : validation.message);
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !status || changing) return;

    // 最终验证
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    if (newUsername.trim() === history?.current) {
      setValidationError('新用户名与当前用户名相同');
      return;
    }

    try {
      setChanging(true);
      setMessage(null);
      
      const result: UsernameChangeResult = await changeUsername(user.uid, newUsername);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // 重新加载数据
        await loadUserData();
        
        // 通知其他页面用户名已更新
        window.dispatchEvent(new CustomEvent('usernameUpdated', { 
          detail: { newUsername: newUsername.trim() } 
        }));
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('修改用户名失败:', error);
      setMessage({ type: 'error', text: '修改失败，请重试' });
    } finally {
      setChanging(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">正在跳转到登录页面...</div>
      </div>
    );
  }

  if (!status || !history) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          {error ? (
            <>
              <p className="text-red-600 mb-4">错误: {error}</p>
              <button 
                onClick={loadUserData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-4"
              >
                重试
              </button>
              <button 
                onClick={() => router.push('/test-auth')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                检查认证状态
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">加载失败</p>
              <button 
                onClick={loadUserData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                重试
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">用户名设置</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 当前状态卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">当前用户名</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xl font-medium text-gray-900">{history.current}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${status.canChange ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {status.canChange ? '可以修改' : '暂时无法修改'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  剩余次数: {status.remainingChanges}/3
                </span>
              </div>
              
              {status.nextChangeDate && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-600">
                    {formatTimeUntilNextChange(status.nextChangeDate)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* 修改用户名表单 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">修改用户名</h2>
            
            {/* 规则说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">用户名规则：</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>长度为 2-20 个字符</li>
                    <li>只能包含字母、数字、下划线和中文字符</li>
                    <li>不能与历史用户名重复</li>
                    <li>每个账户最多可修改 3 次</li>
                    <li>用完 3 次后需等待 30 天才能再次修改</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  新用户名
                </label>
                <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  disabled={!status.canChange || changing}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    validationError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入新的用户名"
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              {!status.canChange && status.reason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <p className="text-sm text-orange-800">{status.reason}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!status.canChange || changing || !!validationError || newUsername.trim() === history.current}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {changing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>修改中...</span>
                  </div>
                ) : (
                  '确认修改'
                )}
              </button>
            </form>
          </motion.div>

          {/* 修改历史 */}
          {history.history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">修改历史</h2>
              </div>
              
              <div className="space-y-3">
                {history.history.map((username, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{username}</span>
                    <span className="text-xs text-gray-500">历史用户名</span>
                  </div>
                ))}
              </div>
              
              {history.lastChange && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    最后修改时间: {history.lastChange.toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* 消息提示 */}
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : message.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {message.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                <p className={`text-sm font-medium ${
                  message.type === 'success' 
                    ? 'text-green-800' 
                    : message.type === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
} 