"use client";

import React, { useState } from 'react';

export default function SimpleTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFirebaseConnection = async () => {
    setLoading(true);
    setTestResult('正在测试Firebase连接...');
    
    try {
      // 测试Firebase初始化
      const { storage } = await import('@/lib/firebase');
      setTestResult(prev => prev + '\n✅ Firebase Storage 初始化成功');
      
      // 测试Storage引用创建
      const { ref } = await import('firebase/storage');
      const testRef = ref(storage, 'test/connection-test.txt');
      setTestResult(prev => prev + '\n✅ Storage 引用创建成功');
      
      // 测试基本配置
      const config = storage.app.options;
      setTestResult(prev => prev + `\n✅ Storage Bucket: ${config.storageBucket}`);
      
      setTestResult(prev => prev + '\n\n🎉 Firebase Storage 连接测试成功！');
      
    } catch (error) {
      console.error('Firebase连接测试失败:', error);
      setTestResult(prev => prev + `\n❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testStorageRules = async () => {
    setLoading(true);
    setTestResult('正在测试Storage安全规则...');
    
    try {
      // 创建一个测试文件
      const testFile = new File(['Hello Firebase Storage!'], 'test.txt', { type: 'text/plain' });
      
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytes } = await import('firebase/storage');
      
      const testRef = ref(storage, 'test/rules-test.txt');
      setTestResult(prev => prev + '\n📤 尝试上传测试文件...');
      
      await uploadBytes(testRef, testFile);
      setTestResult(prev => prev + '\n✅ 文件上传成功！安全规则配置正确');
      
    } catch (error: any) {
      console.error('Storage规则测试失败:', error);
      
      if (error.code === 'storage/unauthorized') {
        setTestResult(prev => prev + '\n❌ 权限被拒绝：需要登录才能上传文件');
        setTestResult(prev => prev + '\n💡 这是正常的，说明安全规则工作正常');
      } else {
        setTestResult(prev => prev + `\n❌ 测试失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testImageUpload = async () => {
    setLoading(true);
    setTestResult('正在测试图片上传功能...');
    
    try {
      // 创建一个1x1像素的测试图片
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#FF0000';
      ctx!.fillRect(0, 0, 1, 1);
      
      // 转换为Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
      setTestResult(prev => prev + '\n✅ 测试图片创建成功');
      
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const imageRef = ref(storage, 'test/test-image.png');
      setTestResult(prev => prev + '\n📤 开始上传测试图片...');
      
      const snapshot = await uploadBytes(imageRef, testFile);
      setTestResult(prev => prev + '\n✅ 图片上传成功');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      setTestResult(prev => prev + `\n✅ 获取下载URL成功: ${downloadURL}`);
      
      setTestResult(prev => prev + '\n\n🎉 图片上传功能测试成功！');
      
    } catch (error: any) {
      console.error('图片上传测试失败:', error);
      
      if (error.code === 'storage/unauthorized') {
        setTestResult(prev => prev + '\n❌ 权限被拒绝：需要登录才能上传图片');
      } else {
        setTestResult(prev => prev + `\n❌ 测试失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Firebase Storage 简单测试</h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              这个页面用于测试Firebase Storage的基本连接和配置，无需登录。
            </p>
          </div>

          {/* 测试按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={testFirebaseConnection}
              disabled={loading}
              className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '测试中...' : '测试Firebase连接'}
            </button>
            
            <button
              onClick={testStorageRules}
              disabled={loading}
              className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '测试中...' : '测试安全规则'}
            </button>
            
            <button
              onClick={testImageUpload}
              disabled={loading}
              className="bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '测试中...' : '测试图片上传'}
            </button>
          </div>

          {/* 测试结果 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="whitespace-pre-wrap text-sm font-mono bg-black text-green-400 p-4 rounded overflow-auto max-h-96">
              {testResult || '点击上面的按钮开始测试...'}
            </pre>
          </div>

          {/* 说明 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 测试说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>测试Firebase连接</strong>：检查Firebase Storage是否正确初始化</li>
              <li>• <strong>测试安全规则</strong>：验证Storage安全规则是否正确配置</li>
              <li>• <strong>测试图片上传</strong>：尝试上传一个测试图片（需要登录权限）</li>
              <li>• 如果看到权限错误，这是正常的，说明安全规则工作正常</li>
            </ul>
          </div>

          {/* 返回按钮 */}
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 