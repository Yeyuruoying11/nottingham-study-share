"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  checkUsernameChangeStatus,
  getUsernameHistory,
  type UsernameStatus
} from '@/lib/username-service';

export default function DebugUserPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [status, setStatus] = useState<UsernameStatus | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
      loadAllData();
    }
  }, [mounted, user, router]);

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始加载用户数据，用户UID:', user.uid);
      
      // 1. 获取原始用户数据
      console.log('1. 查询用户文档...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      console.log('用户文档存在:', userDocSnap.exists());
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        console.log('用户文档数据:', data);
        setUserData(data);
      } else {
        console.log('用户文档不存在，尝试查找所有用户文档...');
        
        // 如果直接查询失败，尝试查找所有用户文档
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        console.log('查询结果数量:', querySnapshot.size);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log('通过查询找到用户数据:', userData);
          setUserData(userData);
        } else {
          setError(`用户文档不存在。UID: ${user.uid}`);
          return;
        }
      }
      
      // 2. 获取用户名状态
      console.log('2. 检查用户名状态...');
      const statusData = await checkUsernameChangeStatus(user.uid);
      console.log('用户名状态:', statusData);
      setStatus(statusData);
      
      // 3. 获取用户名历史
      console.log('3. 获取用户名历史...');
      const historyData = await getUsernameHistory(user.uid);
      console.log('用户名历史:', historyData);
      setHistory(historyData);
      
      console.log('所有数据加载完成');
      
    } catch (err: any) {
      console.error('加载数据失败:', err);
      console.error('错误详情:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(`${err.message || '加载失败'} (详情请查看控制台)`);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">用户数据调试</h1>
          <button 
            onClick={loadAllData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新数据
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">错误: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Firebase Auth 用户信息 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-600">Firebase Auth 用户信息</h2>
            <div className="space-y-2 text-sm">
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>邮箱:</strong> {user.email}</p>
              <p><strong>显示名称:</strong> {user.displayName || '未设置'}</p>
              <p><strong>头像:</strong> {user.photoURL || '无'}</p>
              <p><strong>邮箱验证:</strong> {user.emailVerified ? '已验证' : '未验证'}</p>
              <p><strong>创建时间:</strong> {user.metadata.creationTime}</p>
              <p><strong>最后登录:</strong> {user.metadata.lastSignInTime}</p>
            </div>
          </div>

          {/* Firestore 用户文档 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">Firestore 用户文档</h2>
            {userData ? (
              <div className="space-y-2 text-sm">
                <p><strong>文档UID:</strong> {userData.uid}</p>
                <p><strong>邮箱:</strong> {userData.email}</p>
                <p><strong>显示名称:</strong> {userData.displayName || '未设置'}</p>
                <p><strong>大学:</strong> {userData.university || '未设置'}</p>
                <p><strong>用户名修改次数:</strong> {userData.usernameChangeCount || 0}</p>
                <p><strong>最后修改时间:</strong> {userData.lastUsernameChange ? userData.lastUsernameChange.toDate().toLocaleString() : '无'}</p>
                <p><strong>历史用户名:</strong> {JSON.stringify(userData.usernameHistory || [])}</p>
                <p><strong>创建时间:</strong> {userData.createdAt ? userData.createdAt.toDate().toLocaleString() : '无'}</p>
                <p><strong>更新时间:</strong> {userData.updatedAt ? userData.updatedAt.toDate().toLocaleString() : '无'}</p>
              </div>
            ) : (
              <p className="text-gray-500">无数据</p>
            )}
          </div>

          {/* 用户名状态 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-purple-600">用户名修改状态</h2>
            {status ? (
              <div className="space-y-2 text-sm">
                <p><strong>可以修改:</strong> {status.canChange ? '是' : '否'}</p>
                <p><strong>剩余次数:</strong> <span className="text-lg font-bold text-green-600">{status.remainingChanges}/3</span></p>
                {status.nextChangeDate && (
                  <p><strong>下次可修改时间:</strong> {status.nextChangeDate.toLocaleString()}</p>
                )}
                {status.reason && (
                  <p><strong>限制原因:</strong> {status.reason}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">无数据</p>
            )}
          </div>

          {/* 用户名历史 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">用户名历史</h2>
            {history ? (
              <div className="space-y-2 text-sm">
                <p><strong>当前用户名:</strong> {history.current}</p>
                <p><strong>修改次数:</strong> {history.changeCount}</p>
                <p><strong>最后修改:</strong> {history.lastChange ? history.lastChange.toLocaleString() : '无'}</p>
                <div>
                  <strong>历史记录:</strong>
                  {history.history.length > 0 ? (
                    <ul className="mt-1 ml-4 list-disc">
                      {history.history.map((name: string, index: number) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ml-2 text-gray-500">无历史记录</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">无数据</p>
            )}
          </div>
        </div>

        {/* 计算逻辑验证 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600">计算逻辑验证</h2>
          {userData && status && (
            <div className="space-y-2 text-sm">
              <p><strong>原始修改次数:</strong> {userData.usernameChangeCount || 0}</p>
              <p><strong>计算剩余次数:</strong> {3 - (userData.usernameChangeCount || 0)}</p>
              <p><strong>服务返回剩余次数:</strong> {status.remainingChanges}</p>
              <p><strong>计算是否一致:</strong> {
                (3 - (userData.usernameChangeCount || 0)) === status.remainingChanges ? 
                '✅ 一致' : '❌ 不一致'
              }</p>
              
              {userData.lastUsernameChange && (
                <>
                  <p><strong>最后修改时间:</strong> {userData.lastUsernameChange.toDate().toLocaleString()}</p>
                  <p><strong>距离现在:</strong> {Math.floor((Date.now() - userData.lastUsernameChange.toDate().getTime()) / (1000 * 60 * 60 * 24))} 天</p>
                  <p><strong>是否超过30天:</strong> {
                    (Date.now() - userData.lastUsernameChange.toDate().getTime()) >= (30 * 24 * 60 * 60 * 1000) ? 
                    '✅ 是' : '❌ 否'
                  }</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* 返回按钮 */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/settings/username')}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-4"
          >
            去用户名设置
          </button>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
} 