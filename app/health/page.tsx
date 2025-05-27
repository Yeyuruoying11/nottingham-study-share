"use client";

import { useState, useEffect } from 'react';

export default function HealthCheckPage() {
  const [status, setStatus] = useState({
    nextjs: false,
    firebase: false,
    env: false,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const checkHealth = async () => {
      // 检查Next.js
      const nextjsOk = typeof window !== 'undefined';
      
      // 检查环境变量
      const envOk = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      );
      
      // 检查Firebase
      let firebaseOk = false;
      try {
        const { db } = await import('@/lib/firebase');
        firebaseOk = !!db;
      } catch (error) {
        console.error('Firebase check failed:', error);
      }
      
      setStatus({
        nextjs: nextjsOk,
        firebase: firebaseOk,
        env: envOk,
        timestamp: new Date().toISOString()
      });
    };
    
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">网站健康检查</h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Next.js</span>
            <span className={`px-2 py-1 rounded text-sm ${
              status.nextjs ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.nextjs ? '✅ 正常' : '❌ 异常'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Firebase</span>
            <span className={`px-2 py-1 rounded text-sm ${
              status.firebase ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.firebase ? '✅ 正常' : '❌ 异常'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>环境变量</span>
            <span className={`px-2 py-1 rounded text-sm ${
              status.env ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.env ? '✅ 正常' : '❌ 异常'}
            </span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            检查时间: {status.timestamp}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            域名: {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}
          </p>
        </div>
        
        <div className="mt-6">
          <a 
            href="/"
            className="block w-full text-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
} 