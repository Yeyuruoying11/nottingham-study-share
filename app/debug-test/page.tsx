"use client";

import React, { useState } from 'react';

export default function DebugTestPage() {
  const [message, setMessage] = useState('页面已加载');
  const [clickCount, setClickCount] = useState(0);

  const handleSimpleClick = () => {
    console.log('按钮被点击了！');
    setClickCount(prev => prev + 1);
    setMessage(`按钮被点击了 ${clickCount + 1} 次`);
  };

  const testBasicFunction = async () => {
    console.log('开始基本功能测试...');
    setMessage('正在测试基本功能...');
    
    try {
      // 测试基本的异步操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('✅ 基本功能测试成功！');
      console.log('基本功能测试成功');
    } catch (error) {
      console.error('基本功能测试失败:', error);
      setMessage('❌ 基本功能测试失败');
    }
  };

  const testFirebaseImport = async () => {
    console.log('开始测试Firebase导入...');
    setMessage('正在测试Firebase导入...');
    
    try {
      console.log('尝试导入Firebase...');
      const firebase = await import('@/lib/firebase');
      console.log('Firebase导入成功:', firebase);
      
      setMessage('✅ Firebase导入成功！');
      console.log('Firebase storage:', firebase.storage);
      
    } catch (error) {
      console.error('Firebase导入失败:', error);
      setMessage(`❌ Firebase导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  console.log('DebugTestPage 组件已渲染');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🐛 调试测试页面</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">状态信息</h2>
            <p className="text-blue-700">消息: {message}</p>
            <p className="text-blue-700">点击次数: {clickCount}</p>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={handleSimpleClick}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600"
            >
              简单点击测试
            </button>
            
            <button
              onClick={testBasicFunction}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600"
            >
              基本功能测试
            </button>
            
            <button
              onClick={testFirebaseImport}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600"
            >
              Firebase导入测试
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="font-semibold mb-2">调试说明</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 打开浏览器开发者工具 (F12)</li>
              <li>• 查看Console标签页的日志信息</li>
              <li>• 点击按钮查看是否有错误信息</li>
              <li>• 如果按钮无反应，可能是JavaScript执行有问题</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-500 hover:text-blue-700">返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
} 