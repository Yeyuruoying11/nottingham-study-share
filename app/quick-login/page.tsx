"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function QuickLoginPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('正在测试登录...');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setResult(`✅ 登录成功！用户ID: ${userCredential.user.uid}`);
    } catch (error: any) {
      setResult(`❌ 登录失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    setResult('正在测试注册...');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setResult(`✅ 注册成功！用户ID: ${userCredential.user.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setResult(`💡 邮箱已存在，尝试登录...`);
        testLogin();
        return;
      }
      setResult(`❌ 注册失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setResult('正在测试Firebase Auth连接...');
    
    try {
      // 测试Auth初始化
      setResult(prev => prev + '\n✅ Firebase Auth 初始化成功');
      setResult(prev => prev + `\n✅ Auth Domain: ${auth.app.options.authDomain}`);
      setResult(prev => prev + '\n\n尝试注册/登录测试账户...');
      
      await testRegister();
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Auth测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🚀 快速登录测试</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testAuth}
              disabled={loading}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? '测试中...' : '测试Auth连接'}
            </button>
            
            <button
              onClick={testRegister}
              disabled={loading}
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-300"
            >
              {loading ? '测试中...' : '测试注册'}
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:bg-gray-300"
            >
              {loading ? '测试中...' : '测试登录'}
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="font-semibold mb-2">测试结果</h2>
            <pre className="whitespace-pre-wrap text-sm bg-black text-green-400 p-3 rounded overflow-auto max-h-64">
              {result || '点击按钮开始测试...'}
            </pre>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-500 hover:text-blue-700">返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
} 